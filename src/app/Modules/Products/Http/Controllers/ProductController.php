<?php

namespace App\Modules\Products\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Modules\Products\Contracts\ProductRepositoryInterface;
use App\Modules\Products\Http\Requests\StoreProductRequest;
use App\Modules\Products\Http\Requests\UpdateProductRequest;
use App\Modules\Products\Services\ProductService;
use App\Modules\Products\Support\ProductActivityHistoryPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(
        protected ProductRepositoryInterface $products,
        protected ProductService $service
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Product::class);

        $allowedPerPage = [10, 15, 20, 25, 50, 100];
        $perPage = $this->inertiaTablePerPage($request, $allowedPerPage, 15);

        [$sf, $sd] = $this->inertiaTableSort($request, [
            'sort_order',
            'code',
            'name',
            'is_active',
            'id',
            'created_at',
            'updated_at',
        ], 'sort_order');

        $search = trim((string) $request->query('search', ''));
        if (mb_strlen($search) > 255) {
            $search = mb_substr($search, 0, 255);
        }

        $listRead = $this->products->paginate($perPage, $sf, $sd, $search !== '' ? $search : null);
        $paginator = $listRead->paginator;
        $paginator->withQueryString();

        $historySet = ProductActivityHistoryPresenter::productIdsHavingHistorySet(
            $paginator->getCollection()->pluck('id')->all(),
        );

        $paginator->setCollection(
            $paginator->getCollection()->map(function (Product $p) use ($historySet): array {
                return [
                    'id' => $p->id,
                    'code' => $p->code,
                    'name' => $p->name,
                    'is_active' => (bool) $p->is_active,
                    'has_change_history' => isset($historySet[$p->id]),
                    'category' => $p->category ? ['id' => $p->category->id, 'name' => $p->category->name] : null,
                    'member' => $p->member
                        ? [
                            'id' => $p->member->id,
                            'company_name' => $p->member->company_name,
                        ]
                        : null,
                    'prices' => $p->prices->map(static fn ($pr) => [
                        'price_list_id' => $pr->price_list_id,
                        'list_name' => $pr->priceList?->name,
                        'currency' => $pr->priceList?->currency,
                        'amount' => (string) $pr->amount,
                    ])->values()->all(),
                    'created_at' => $p->created_at?->toIso8601String(),
                    'updated_at' => $p->updated_at?->toIso8601String(),
                ];
            }),
        );

        return Inertia::render('modules/products/prodotti/index', [
            'products' => [
                'data' => $paginator->items(),
                'pagination' => $this->inertiaTablePaginationMeta($paginator),
            ],
            'filters' => [
                'sort_field' => $sf,
                'sort_order' => $sd,
                'search' => $search,
            ],
            'productsModuleDataLayer' => $listRead->dataSource,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Product::class);

        return Inertia::render('modules/products/prodotti/create', [
            'memberOwners' => $this->memberOwnerOptions(),
            'categoryOptions' => $this->categoryOptions(),
            'priceListOptions' => $this->priceListOptions(),
            'productsModuleDataLayer' => null,
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $this->service->create($request->user(), $request->validated());

        return redirect()
            ->route('modules.products.prodotti.index')
            ->with('success', __('Prodotto creato.'));
    }

    public function show(Product $product): Response
    {
        $this->authorize('view', $product);

        $rowRead = $this->products->find($product->id);
        $row = $rowRead->model;
        if (! $row instanceof Product) {
            abort(404);
        }

        return Inertia::render('modules/products/prodotti/show', [
            'product' => $this->productPayload($row),
            'productsModuleDataLayer' => $rowRead->dataSource,
        ]);
    }

    public function changeHistory(Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        return response()->json([
            'entries' => ProductActivityHistoryPresenter::forProduct($product),
        ]);
    }

    public function edit(Product $product): Response
    {
        $this->authorize('update', $product);

        $rowRead = $this->products->find($product->id);
        $row = $rowRead->model;
        if (! $row instanceof Product) {
            abort(404);
        }

        return Inertia::render('modules/products/prodotti/edit', [
            'product' => $this->productPayload($row),
            'productChangeHistory' => ProductActivityHistoryPresenter::forProduct($row),
            'productHasChangeHistory' => ProductActivityHistoryPresenter::shouldShowChangeHistoryIcon($row->id),
            'memberOwners' => $this->memberOwnerOptions(),
            'categoryOptions' => $this->categoryOptions(),
            'priceListOptions' => $this->priceListOptions(),
            'productsModuleDataLayer' => $rowRead->dataSource,
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $data = $request->validated();
        $saveRedirect = $data['save_redirect'] ?? 'list';
        unset($data['save_redirect']);

        $this->service->update($request->user(), $product, $data);

        if ($saveRedirect === 'stay') {
            return redirect()->back()->with('success', __('Prodotto aggiornato.'));
        }

        return redirect()
            ->route('modules.products.prodotti.index')
            ->with('success', __('Prodotto aggiornato.'));
    }

    public function destroy(Product $product): RedirectResponse
    {
        $this->authorize('delete', $product);

        $this->service->delete(request()->user(), $product);

        return redirect()
            ->route('modules.products.prodotti.index')
            ->with('success', __('Prodotto eliminato.'));
    }

    public function toggleActive(Product $product): RedirectResponse
    {
        $this->authorize('update', $product);

        $product->update(['is_active' => ! $product->is_active]);

        return redirect()
            ->back()
            ->with('success', __('Stato prodotto aggiornato.'));
    }

    /**
     * @return list<array{id: int, label: string}>
     */
    protected function memberOwnerOptions(): array
    {
        return Member::query()
            ->when(! request()->user()?->isAdmin(), fn ($q) => $q->whereKey(request()->user()?->getOwnerMember()?->id))
            ->owners()
            ->orderBy('company_name')
            ->orderBy('id')
            ->get(['id', 'company_name', 'first_name', 'last_name'])
            ->map(fn (Member $m) => [
                'id' => $m->id,
                'label' => $m->company_name ?: trim(($m->first_name ?? '').' '.($m->last_name ?? '')) ?: ('#'.$m->id),
            ])
            ->all();
    }

    /**
     * @return list<array{id: int, label: string, member_id: int}>
     */
    protected function categoryOptions(): array
    {
        $q = ProductCategory::query()
            ->orderBy('member_id')
            ->orderBy('sort_order')
            ->orderBy('name');

        if (! request()->user()?->isAdmin()) {
            $q->where('member_id', request()->user()?->getOwnerMember()?->id);
        } else {
            $q->withoutGlobalScope('account');
        }

        return $q->with('member:id,company_name,first_name,last_name')
            ->get(['id', 'name', 'member_id'])
            ->map(function (ProductCategory $c) {
                $m = $c->member;
                $ml = $m ? (string) ($m->company_name ?: trim(($m->first_name ?? '').' '.($m->last_name ?? '')) ?: ('#'.$m->id)) : '';

                return [
                    'id' => $c->id,
                    'member_id' => $c->member_id,
                    'label' => request()->user()?->isAdmin() ? ($ml.' — '.$c->name) : $c->name,
                ];
            })
            ->all();
    }

    /**
     * @return list<array{id: int, label: string, member_id: int, currency: string}>
     */
    protected function priceListOptions(): array
    {
        $q = PriceList::query()
            ->orderBy('member_id')
            ->orderBy('name');

        if (! request()->user()?->isAdmin()) {
            $q->where('member_id', request()->user()?->getOwnerMember()?->id);
        } else {
            $q->withoutGlobalScope('account');
        }

        return $q->with('member:id,company_name,first_name,last_name')
            ->get(['id', 'name', 'currency', 'member_id'])
            ->map(function (PriceList $pl) {
                $m = $pl->member;
                $ml = $m ? (string) ($m->company_name ?: trim(($m->first_name ?? '').' '.($m->last_name ?? '')) ?: ('#'.$m->id)) : '';

                return [
                    'id' => $pl->id,
                    'member_id' => $pl->member_id,
                    'currency' => $pl->currency,
                    'label' => request()->user()?->isAdmin() ? ($ml.' — '.$pl->name) : $pl->name,
                ];
            })
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    protected function productPayload(Product $product): array
    {
        $member = $product->member;

        return [
            'id' => $product->id,
            'member_id' => $product->member_id,
            'member_label' => $member
                ? (string) ($member->company_name ?: trim(($member->first_name ?? '').' '.($member->last_name ?? '')) ?: ('#'.$member->id))
                : null,
            'product_category_id' => $product->product_category_id,
            'category_label' => $product->category?->name,
            'code' => $product->code,
            'name' => $product->name,
            'invoice_text' => $product->invoice_text,
            'revenue_code' => $product->revenue_code,
            'revenue_description' => $product->revenue_description,
            'sales_code' => $product->sales_code,
            'sales_description' => $product->sales_description,
            'line_kind' => $product->line_kind,
            'sort_order' => $product->sort_order,
            'is_active' => (bool) $product->is_active,
            'prices' => $product->prices->map(fn ($p) => [
                'price_list_id' => $p->price_list_id,
                'list_name' => $p->priceList?->name,
                'currency' => $p->priceList?->currency,
                'amount' => $p->amount,
            ])->values()->all(),
        ];
    }
}
