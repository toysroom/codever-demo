<?php

namespace App\Modules\Customers\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CustomerType;
use App\Models\Member;
use App\Modules\Customers\Http\Requests\StoreCustomerTypeRequest;
use App\Modules\Customers\Http\Requests\UpdateCustomerTypeRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CustomerTypeController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', CustomerType::class);

        $allowedPerPage = [10, 15, 20, 25, 50, 100];
        $perPage = $this->inertiaTablePerPage($request, $allowedPerPage, 15);

        [$sf, $sd] = $this->inertiaTableSort($request, [
            'sort_order',
            'name',
            'customers_count',
            'is_active',
            'id',
            'created_at',
            'updated_at',
        ], 'sort_order');

        $query = CustomerType::query()
            ->with(['member:id,company_name,first_name,last_name'])
            ->withCount('customers');

        $query->orderBy($sf, $sd)->orderBy('id');

        $paginator = $query->paginate($perPage);
        $paginator->withQueryString();
        $paginator->setCollection(
            $paginator->getCollection()->map(fn (CustomerType $t): array => [
                'id' => $t->id,
                'name' => $t->name,
                'description' => $t->description,
                'sort_order' => $t->sort_order,
                'is_active' => (bool) $t->is_active,
                'customers_count' => $t->customers_count,
                'member' => $t->member
                    ? [
                        'id' => $t->member->id,
                        'company_name' => $t->member->company_name,
                    ]
                    : null,
                'created_at' => $t->created_at?->toIso8601String(),
                'updated_at' => $t->updated_at?->toIso8601String(),
            ]),
        );

        return Inertia::render('modules/customers/customer-types/index', [
            'customerTypes' => [
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
        $this->authorize('create', CustomerType::class);

        return Inertia::render('modules/customers/customer-types/create', [
            'memberOwners' => $this->memberOwnerOptions(),
        ]);
    }

    public function store(StoreCustomerTypeRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $memberId = (int) $data['member_id'];

        $owner = Member::query()->owners()->whereKey($memberId)->first();
        if (! $owner) {
            throw ValidationException::withMessages([
                'member_id' => [__('L\'account selezionato non è valido.')],
            ]);
        }

        if (! $request->user()->isAdmin() && $request->user()->getOwnerMember()?->id !== $owner->id) {
            throw ValidationException::withMessages([
                'member_id' => [__('Non puoi creare tipi per un altro account.')],
            ]);
        }

        CustomerType::query()->create([
            'member_id' => $owner->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'sort_order' => (int) ($data['sort_order'] ?? 0),
            'is_active' => true,
        ]);

        return redirect()
            ->route('modules.customers.customer-types.index')
            ->with('success', __('Tipo cliente creato.'));
    }

    public function show(CustomerType $customer_type): Response
    {
        $this->authorize('view', $customer_type);

        $customer_type->loadCount('customers');

        return Inertia::render('modules/customers/customer-types/show', [
            'customerType' => $this->typePayload($customer_type),
        ]);
    }

    public function edit(CustomerType $customer_type): Response
    {
        $this->authorize('update', $customer_type);

        return Inertia::render('modules/customers/customer-types/edit', [
            'customerType' => $this->typePayload($customer_type),
        ]);
    }

    public function update(UpdateCustomerTypeRequest $request, CustomerType $customer_type): RedirectResponse
    {
        $data = $request->validated();
        $saveRedirect = $data['save_redirect'] ?? 'list';
        unset($data['save_redirect']);

        $customer_type->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'sort_order' => (int) ($data['sort_order'] ?? 0),
        ]);

        if ($saveRedirect === 'stay') {
            return redirect()->back()->with('success', __('Tipo cliente aggiornato.'));
        }

        return redirect()
            ->route('modules.customers.customer-types.index')
            ->with('success', __('Tipo cliente aggiornato.'));
    }

    public function destroy(CustomerType $customer_type): RedirectResponse
    {
        $this->authorize('delete', $customer_type);

        $customer_type->delete();

        return redirect()
            ->route('modules.customers.customer-types.index')
            ->with('success', __('Tipo cliente eliminato.'));
    }

    public function toggleActive(CustomerType $customer_type): RedirectResponse
    {
        $this->authorize('update', $customer_type);

        $customer_type->update(['is_active' => ! $customer_type->is_active]);

        return redirect()
            ->route('modules.customers.customer-types.index')
            ->with('success', __('Stato tipo cliente aggiornato.'));
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
    protected function typePayload(CustomerType $type): array
    {
        $member = $type->member;

        return [
            'id' => $type->id,
            'member_id' => $type->member_id,
            'member_label' => $member
                ? (string) ($member->company_name ?: trim(($member->first_name ?? '').' '.($member->last_name ?? '')) ?: ('#'.$member->id))
                : null,
            'name' => $type->name,
            'description' => $type->description,
            'sort_order' => $type->sort_order,
            'is_active' => (bool) $type->is_active,
            'customers_count' => $type->customers_count ?? $type->customers()->count(),
        ];
    }
}
