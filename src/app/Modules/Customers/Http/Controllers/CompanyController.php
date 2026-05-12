<?php

namespace App\Modules\Customers\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Member;
use App\Modules\Customers\Http\Requests\StoreCompanyRequest;
use App\Modules\Customers\Http\Requests\UpdateCompanyRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Company::class);

        $allowedPerPage = [10, 15, 20, 25, 50, 100];
        $perPage = $this->inertiaTablePerPage($request, $allowedPerPage, 15);

        [$sortField, $sortOrder] = $this->inertiaTableSort($request, [
            'name',
            'legal_name',
            'vat_number',
            'email',
            'web_domains_count',
            'is_default',
            'id',
            'created_at',
            'updated_at',
        ], 'name');

        $query = Company::query()
            ->with(['member:id,company_name,first_name,last_name'])
            ->withCount('webDomains');

        if ($sortField === 'is_default') {
            $query->orderBy('is_default', $sortOrder);
        } else {
            $query->orderBy($sortField, $sortOrder);
        }

        $query->orderBy('name')->orderBy('id');

        $paginator = $query->paginate($perPage);
        $paginator->withQueryString();
        $paginator->setCollection(
            $paginator->getCollection()->map(
                fn (Company $c): array => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'legal_name' => $c->legal_name,
                    'vat_number' => $c->vat_number,
                    'email' => $c->email,
                    'is_default' => (bool) $c->is_default,
                    'web_domains_count' => $c->web_domains_count,
                    'member' => $c->member
                        ? [
                            'id' => $c->member->id,
                            'company_name' => $c->member->company_name,
                        ]
                        : null,
                    'created_at' => $c->created_at?->toIso8601String(),
                    'updated_at' => $c->updated_at?->toIso8601String(),
                ],
            ),
        );

        return Inertia::render('modules/companies/index', [
            'companies' => [
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
        $this->authorize('create', Company::class);

        return Inertia::render('modules/companies/create', [
            'memberOwners' => $this->memberOwnerOptions(),
        ]);
    }

    public function store(StoreCompanyRequest $request): RedirectResponse
    {
        $this->authorize('create', Company::class);

        $data = $request->validated();
        $isDefault = (bool) ($data['is_default'] ?? false);

        $company = DB::transaction(function () use ($data, $isDefault): Company {
            /** @var Company $row */
            $row = Company::query()->create([
                ...$data,
                'is_default' => $isDefault,
            ]);
            if ($isDefault) {
                $this->clearOtherDefaults($row);
            }

            return $row;
        });

        return redirect()
            ->route('modules.companies.show', $company)
            ->with('success', __('Azienda creata.'));
    }

    public function show(Company $company): Response
    {
        $this->authorize('view', $company);

        $company->loadCount('webDomains');

        return Inertia::render('modules/companies/show', [
            'company' => $this->companyPayload($company),
        ]);
    }

    public function edit(Company $company): Response
    {
        $this->authorize('update', $company);

        return Inertia::render('modules/companies/edit', [
            'company' => $this->companyPayload($company),
            'memberOwners' => $this->memberOwnerOptions(),
        ]);
    }

    public function update(UpdateCompanyRequest $request, Company $company): RedirectResponse
    {
        $this->authorize('update', $company);

        $data = $request->validated();
        $saveRedirect = $data['save_redirect'] ?? 'list';
        unset($data['save_redirect']);

        $isDefault = (bool) ($data['is_default'] ?? $company->is_default);

        DB::transaction(function () use ($company, $data, $isDefault): void {
            $company->update([
                ...$data,
                'is_default' => $isDefault,
            ]);
            if ($isDefault) {
                $this->clearOtherDefaults($company);
            }
        });

        if ($saveRedirect === 'stay') {
            return redirect()->back()->with('success', __('Azienda aggiornata.'));
        }

        return redirect()
            ->route('modules.companies.index')
            ->with('success', __('Azienda aggiornata.'));
    }

    public function destroy(Company $company): RedirectResponse
    {
        $this->authorize('delete', $company);

        $company->delete();

        return redirect()
            ->route('modules.companies.index')
            ->with('success', __('Azienda eliminata.'));
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
    protected function companyPayload(Company $company): array
    {
        $member = $company->member;

        return [
            'id' => $company->id,
            'member_id' => $company->member_id,
            'member_label' => $member
                ? (string) ($member->company_name ?: trim(($member->first_name ?? '').' '.($member->last_name ?? '')) ?: ('#'.$member->id))
                : null,
            'name' => $company->name,
            'legal_name' => $company->legal_name,
            'vat_number' => $company->vat_number,
            'email' => $company->email,
            'phone' => $company->phone,
            'pec' => $company->pec,
            'sdi_recipient_code' => $company->sdi_recipient_code,
            'address' => $company->address,
            'city' => $company->city,
            'postal_code' => $company->postal_code,
            'province' => $company->province,
            'country' => $company->country,
            'notes' => $company->notes,
            'is_default' => (bool) $company->is_default,
            'web_domains_count' => $company->web_domains_count ?? 0,
        ];
    }

    protected function clearOtherDefaults(Company $keep): void
    {
        Company::query()
            ->where('member_id', $keep->member_id)
            ->whereKeyNot($keep->id)
            ->update(['is_default' => false]);
    }
}
