<?php

namespace App\Modules\Products\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\PriceList;
use App\Modules\Products\Contracts\PriceListRepositoryInterface;
use App\Modules\Products\Http\Requests\StorePriceListRequest;
use App\Modules\Products\Http\Requests\UpdatePriceListRequest;
use App\Modules\Products\Services\PriceListService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PriceListController extends Controller
{
    public function __construct(
        protected PriceListRepositoryInterface $lists,
        protected PriceListService $service
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', PriceList::class);

        $allowedPerPage = [10, 15, 20, 25, 50, 100];
        $perPage = $this->inertiaTablePerPage($request, $allowedPerPage, 15);

        [$sf, $sd] = $this->inertiaTableSort($request, [
            'name',
            'code',
            'currency',
            'is_default',
            'is_active',
            'id',
            'created_at',
            'updated_at',
        ], 'name');

        $paginator = $this->lists->paginate($perPage, $sf, $sd);
        $paginator->withQueryString();

        $paginator->setCollection(
            $paginator->getCollection()->map(static fn (PriceList $l): array => [
                'id' => $l->id,
                'name' => $l->name,
                'code' => $l->code,
                'currency' => $l->currency,
                'is_default' => (bool) $l->is_default,
                'is_active' => (bool) $l->is_active,
                'member' => $l->member
                    ? [
                        'id' => $l->member->id,
                        'company_name' => $l->member->company_name,
                        'first_name' => $l->member->first_name,
                        'last_name' => $l->member->last_name,
                    ]
                    : null,
                'created_at' => $l->created_at?->toIso8601String(),
                'updated_at' => $l->updated_at?->toIso8601String(),
            ]),
        );

        return Inertia::render('modules/products/listini/index', [
            'priceLists' => [
                'data' => $paginator->items(),
                'pagination' => $this->inertiaTablePaginationMeta($paginator),
            ],
            'filters' => [
                'sort_field' => $sf,
                'sort_order' => $sd,
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', PriceList::class);

        return Inertia::render('modules/products/listini/create', [
            'memberOwners' => $this->memberOwnerOptions(),
        ]);
    }

    public function store(StorePriceListRequest $request): RedirectResponse
    {
        $this->service->create($request->user(), $request->validated());

        return redirect()
            ->route('modules.products.listini.index')
            ->with('success', __('Listino creato.'));
    }

    public function show(PriceList $price_list): Response
    {
        $this->authorize('view', $price_list);

        $row = $this->lists->find($price_list->id);
        if (! $row) {
            abort(404);
        }

        return Inertia::render('modules/products/listini/show', [
            'priceList' => $this->listPayload($row),
        ]);
    }

    public function edit(PriceList $price_list): Response
    {
        $this->authorize('update', $price_list);

        $row = $this->lists->find($price_list->id);
        if (! $row) {
            abort(404);
        }

        return Inertia::render('modules/products/listini/edit', [
            'priceList' => $this->listPayload($row),
            'memberOwners' => $this->memberOwnerOptions(),
        ]);
    }

    public function update(UpdatePriceListRequest $request, PriceList $price_list): RedirectResponse
    {
        $data = $request->validated();
        $saveRedirect = $data['save_redirect'] ?? 'list';
        unset($data['save_redirect']);

        $this->service->update($request->user(), $price_list, $data);

        if ($saveRedirect === 'stay') {
            return redirect()->back()->with('success', __('Listino aggiornato.'));
        }

        return redirect()
            ->route('modules.products.listini.index')
            ->with('success', __('Listino aggiornato.'));
    }

    public function destroy(PriceList $price_list): RedirectResponse
    {
        $this->authorize('delete', $price_list);

        $this->service->delete(request()->user(), $price_list);

        return redirect()
            ->route('modules.products.listini.index')
            ->with('success', __('Listino eliminato.'));
    }

    public function toggleActive(PriceList $price_list): RedirectResponse
    {
        $this->authorize('update', $price_list);

        $price_list->update(['is_active' => ! $price_list->is_active]);

        return redirect()
            ->route('modules.products.listini.index')
            ->with('success', __('Stato listino aggiornato.'));
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
     * @return array<string, mixed>
     */
    protected function listPayload(PriceList $list): array
    {
        $member = $list->member;

        return [
            'id' => $list->id,
            'member_id' => $list->member_id,
            'member_label' => $member
                ? (string) ($member->company_name ?: trim(($member->first_name ?? '').' '.($member->last_name ?? '')) ?: ('#'.$member->id))
                : null,
            'name' => $list->name,
            'code' => $list->code,
            'currency' => $list->currency,
            'valid_from' => $list->valid_from?->format('Y-m-d'),
            'valid_to' => $list->valid_to?->format('Y-m-d'),
            'is_default' => $list->is_default,
            'notes' => $list->notes,
            'is_active' => (bool) $list->is_active,
        ];
    }
}
