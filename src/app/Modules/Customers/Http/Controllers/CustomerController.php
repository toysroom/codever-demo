<?php

namespace App\Modules\Customers\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerType;
use App\Models\Member;
use App\Modules\Customers\Contracts\CustomerRepositoryInterface;
use App\Modules\Customers\Http\Requests\StoreCustomerRequest;
use App\Modules\Customers\Http\Requests\UpdateCustomerRequest;
use App\Modules\Customers\Services\CustomerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function __construct(
        protected CustomerRepositoryInterface $customers,
        protected CustomerService $customerService
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Customer::class);

        $allowedPerPage = [10, 15, 20, 25, 50, 100];
        $defaultPerPage = 15;
        $perPage = $this->inertiaTablePerPage($request, $allowedPerPage, $defaultPerPage);

        [$sortField, $sortOrder] = $this->inertiaTableSort($request, [
            'last_name',
            'first_name',
            'company_name',
            'vat_number',
            'phone',
            'entity_type',
            'external_code',
            'id',
            'created_at',
            'updated_at',
        ], 'last_name');

        /** @var \Illuminate\Contracts\Pagination\LengthAwarePaginator $paginator */
        $paginator = $this->customers->paginateWithMember($perPage, $sortField, $sortOrder)->withQueryString();

        $paginator->setCollection(
            $paginator->getCollection()->map(static function (Customer $customer): array {
                $row = $customer->toArray();
                $row['created_at'] = $customer->created_at?->toIso8601String();
                $row['updated_at'] = $customer->updated_at?->toIso8601String();

                return $row;
            }),
        );

        return Inertia::render('modules/customers/index', [
            'customers' => [
                'data' => $paginator->items(),
                'pagination' => $this->inertiaTablePaginationMeta($paginator),
            ],
            'filters' => [
                'sort_field' => $sortField,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Customer::class);

        return Inertia::render('modules/customers/create', [
            'memberOwners' => $this->memberOwnerOptions(),
            'customerTypeOptions' => $this->customerTypeOptions(),
        ]);
    }

    public function store(StoreCustomerRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $saveRedirect = $data['save_redirect'] ?? 'list';
        unset($data['save_redirect']);

        $customer = $this->customerService->create($request->user(), $data);

        if ($saveRedirect === 'list') {
            return redirect()
                ->route('modules.customers.index')
                ->with('success', __('Cliente creato.'));
        }

        return redirect()
            ->route('modules.customers.edit', $customer)
            ->with('success', __('Cliente creato.'));
    }

    public function show(Customer $customer): Response
    {
        $this->authorize('view', $customer);

        $customer->load(['user', 'member', 'contacts', 'crmNotes.author', 'customerTypes']);

        return Inertia::render('modules/customers/show', [
            'customer' => $this->customerPayload($customer),
        ]);
    }

    public function edit(Customer $customer): Response
    {
        $this->authorize('update', $customer);

        $customer->load(['user', 'member', 'contacts', 'crmNotes.author', 'customerTypes']);

        return Inertia::render('modules/customers/edit', [
            'customer' => $this->customerPayload($customer),
            'memberOwners' => $this->memberOwnerOptions(),
            'customerTypeOptions' => $this->customerTypeOptions(),
        ]);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): RedirectResponse
    {
        $data = $request->validated();
        $saveRedirect = $data['save_redirect'] ?? 'list';
        unset($data['save_redirect']);

        $this->customerService->update($request->user(), $customer, $data);

        if ($saveRedirect === 'list') {
            return redirect()
                ->route('modules.customers.index')
                ->with('success', __('Cliente aggiornato.'));
        }

        return redirect()
            ->route('modules.customers.edit', $customer)
            ->with('success', __('Cliente aggiornato.'));
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        $this->authorize('delete', $customer);

        $this->customerService->delete($customer);

        return redirect()
            ->route('modules.customers.index')
            ->with('success', __('Cliente eliminato.'));
    }

    public function toggleActive(Customer $customer): RedirectResponse
    {
        $this->authorize('update', $customer);

        $new = ! $customer->is_active;
        $customer->update(['is_active' => $new]);
        if ($customer->user) {
            $customer->user->update(['is_active' => $new]);
        }

        return redirect()
            ->route('modules.customers.index')
            ->with('success', __('Stato cliente aggiornato.'));
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
     * @return list<array{id: int, name: string, member_id: int}>
     */
    protected function customerTypeOptions(): array
    {
        $query = CustomerType::query()
            ->orderBy('sort_order')
            ->orderBy('name');

        if (! request()->user()?->isAdmin()) {
            $ownerId = request()->user()?->getOwnerMember()?->id;
            $query->where('member_id', $ownerId);
        }

        return $query
            ->get(['id', 'name', 'member_id'])
            ->map(fn (CustomerType $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'member_id' => $t->member_id,
            ])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    protected function customerPayload(Customer $customer): array
    {
        $member = $customer->member;

        return [
            'id' => $customer->id,
            'member_id' => $customer->member_id,
            'member_label' => $member
                ? (string) ($member->company_name ?: trim(($member->first_name ?? '').' '.($member->last_name ?? '')) ?: ('#'.$member->id))
                : null,
            'external_code' => $customer->external_code,
            'is_active' => (bool) $customer->is_active,
            'company_name' => $customer->company_name,
            'reference_person' => $customer->reference_person,
            'first_name' => $customer->first_name,
            'last_name' => $customer->last_name,
            'vat_number' => $customer->vat_number,
            'fiscal_code' => $customer->fiscal_code,
            'email' => $customer->user->email,
            'phone' => $customer->phone,
            'mobile_phone' => $customer->mobile_phone,
            'fax' => $customer->fax,
            'contact_email' => $customer->contact_email,
            'pec' => $customer->pec,
            'sdi_recipient_code' => $customer->sdi_recipient_code,
            'website' => $customer->website,
            'notes' => $customer->notes,
            'entity_type' => $customer->entity_type,
            'bank_name' => $customer->bank_name,
            'iban' => $customer->iban,
            'address' => $customer->address,
            'street' => $customer->street,
            'city' => $customer->city,
            'postal_code' => $customer->postal_code,
            'province' => $customer->province,
            'country' => $customer->country,
            'contacts' => $customer->contacts->map(fn ($c) => [
                'id' => $c->id,
                'type' => $c->type,
                'label' => $c->label,
                'value' => $c->value,
            ])->values()->all(),
            'crm_notes' => $customer->crmNotes->map(fn ($n) => [
                'id' => $n->id,
                'body' => $n->body,
                'reminder_at' => $n->reminder_at?->toIso8601String(),
                'reminder_notified_at' => $n->reminder_notified_at?->toIso8601String(),
                'author' => $n->author ? ['id' => $n->author->id, 'name' => $n->author->name] : null,
                'created_at' => $n->created_at?->toIso8601String(),
            ])->values()->all(),
            'customer_types' => $customer->customerTypes->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name,
            ])->values()->all(),
            'customer_type_ids' => $customer->customerTypes->pluck('id')->values()->all(),
        ];
    }
}
