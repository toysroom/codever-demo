<?php

namespace App\Modules\Products\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\ProductCategory;
use App\Modules\Products\Contracts\ProductCategoryRepositoryInterface;
use App\Modules\Products\Http\Requests\StoreProductCategoryRequest;
use App\Modules\Products\Http\Requests\UpdateProductCategoryRequest;
use App\Modules\Products\Services\ProductCategoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductCategoryController extends Controller
{
    public function __construct(
        protected ProductCategoryRepositoryInterface $categories,
        protected ProductCategoryService $service
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', ProductCategory::class);

        $allowedPerPage = [10, 15, 20, 25, 50, 100];
        $perPage = $this->inertiaTablePerPage($request, $allowedPerPage, 15);

        [$sf, $sd] = $this->inertiaTableSort($request, [
            'sort_order',
            'name',
            'is_active',
            'id',
            'parent_id',
            'created_at',
            'updated_at',
        ], 'sort_order');

        $listRead = $this->categories->paginate($perPage, $sf, $sd);
        $paginator = $listRead->paginator;
        $paginator->withQueryString();

        $paginator->setCollection(
            $paginator->getCollection()->map(static fn (ProductCategory $c): array => [
                'id' => $c->id,
                'name' => $c->name,
                'sort_order' => $c->sort_order,
                'is_active' => (bool) $c->is_active,
                'parent' => $c->parent ? ['id' => $c->parent->id, 'name' => $c->parent->name] : null,
                'member' => $c->member
                    ? [
                        'id' => $c->member->id,
                        'company_name' => $c->member->company_name,
                    ]
                    : null,
                'created_at' => $c->created_at?->toIso8601String(),
                'updated_at' => $c->updated_at?->toIso8601String(),
            ]),
        );

        return Inertia::render('modules/products/categorie/index', [
            'categories' => [
                'data' => $paginator->items(),
                'pagination' => $this->inertiaTablePaginationMeta($paginator),
            ],
            'filters' => [
                'sort_field' => $sf,
                'sort_order' => $sd,
            ],
            'productsModuleDataLayer' => $listRead->dataSource,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', ProductCategory::class);

        return Inertia::render('modules/products/categorie/create', [
            'memberOwners' => $this->memberOwnerOptions(),
            'parentOptions' => $this->parentCategoryOptions(),
            'productsModuleDataLayer' => null,
        ]);
    }

    public function store(StoreProductCategoryRequest $request): RedirectResponse
    {
        $this->service->create($request->user(), $request->validated());

        return redirect()
            ->route('modules.products.categorie.index')
            ->with('success', __('Categoria creata.'));
    }

    public function show(ProductCategory $product_category): Response
    {
        $this->authorize('view', $product_category);

        $rowRead = $this->categories->find($product_category->id);
        $row = $rowRead->model;
        if (! $row instanceof ProductCategory) {
            abort(404);
        }

        return Inertia::render('modules/products/categorie/show', [
            'category' => $this->categoryPayload($row),
            'productsModuleDataLayer' => $rowRead->dataSource,
        ]);
    }

    public function edit(ProductCategory $product_category): Response
    {
        $this->authorize('update', $product_category);

        $rowRead = $this->categories->find($product_category->id);
        $row = $rowRead->model;
        if (! $row instanceof ProductCategory) {
            abort(404);
        }

        return Inertia::render('modules/products/categorie/edit', [
            'category' => $this->categoryPayload($row),
            'memberOwners' => $this->memberOwnerOptions(),
            'parentOptions' => $this->parentCategoryOptions(exceptId: $product_category->id),
            'productsModuleDataLayer' => $rowRead->dataSource,
        ]);
    }

    public function update(UpdateProductCategoryRequest $request, ProductCategory $product_category): RedirectResponse
    {
        $data = $request->validated();
        $saveRedirect = $data['save_redirect'] ?? 'list';
        unset($data['save_redirect']);

        $this->service->update($request->user(), $product_category, $data);

        if ($saveRedirect === 'stay') {
            return redirect()->back()->with('success', __('Categoria aggiornata.'));
        }

        return redirect()
            ->route('modules.products.categorie.index')
            ->with('success', __('Categoria aggiornata.'));
    }

    public function destroy(ProductCategory $product_category): RedirectResponse
    {
        $this->authorize('delete', $product_category);

        $this->service->delete(request()->user(), $product_category);

        return redirect()
            ->route('modules.products.categorie.index')
            ->with('success', __('Categoria eliminata.'));
    }

    public function toggleActive(ProductCategory $product_category): RedirectResponse
    {
        $this->authorize('update', $product_category);

        $product_category->update(['is_active' => ! $product_category->is_active]);

        return redirect()
            ->route('modules.products.categorie.index')
            ->with('success', __('Stato categoria aggiornato.'));
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
     * @return list<array{id: int, label: string}>
     */
    protected function parentCategoryOptions(?int $exceptId = null): array
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

        if ($exceptId) {
            $q->whereKeyNot($exceptId);
        }

        return $q->with('member:id,company_name,first_name,last_name')
            ->get(['id', 'name', 'member_id'])
            ->map(function (ProductCategory $c) {
                $m = $c->member;
                $ml = $m ? (string) ($m->company_name ?: trim(($m->first_name ?? '').' '.($m->last_name ?? '')) ?: ('#'.$m->id)) : '';
                $label = request()->user()?->isAdmin() ? ($ml.' — '.$c->name) : $c->name;

                return ['id' => $c->id, 'label' => $label];
            })
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    protected function categoryPayload(ProductCategory $category): array
    {
        $member = $category->member;

        return [
            'id' => $category->id,
            'member_id' => $category->member_id,
            'member_label' => $member
                ? (string) ($member->company_name ?: trim(($member->first_name ?? '').' '.($member->last_name ?? '')) ?: ('#'.$member->id))
                : null,
            'parent_id' => $category->parent_id,
            'parent_label' => $category->parent?->name,
            'name' => $category->name,
            'sort_order' => $category->sort_order,
            'is_active' => (bool) $category->is_active,
        ];
    }
}
