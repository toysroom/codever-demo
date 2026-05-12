<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAccountRequest;
use App\Http\Requests\Admin\UpdateAccountRequest;
use App\Models\Customer;
use App\Models\LicensePlan;
use App\Models\Member;
use App\Models\Module;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class SettingsAccountsController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Member::class, 'account');
    }

    public function index(Request $request): InertiaResponse
    {
        $allowedPerPage = [10, 15, 20, 25, 50, 100];
        $perPage = $this->inertiaTablePerPage($request, $allowedPerPage, 20);

        [$sf, $sd] = $this->inertiaTableSort($request, [
            'company_name',
            'owner_name',
            'owner_email',
            'license_plan_name',
            'max_customers',
            'max_sub_members',
            'subscription_status',
            'id',
            'created_at',
            'updated_at',
        ], 'company_name');

        $search = trim((string) $request->query('search', ''));

        $query = Member::query()
            ->owners()
            ->with(['user:id,name,email,is_active', 'licensePlan:id,name,slug'])
            ->leftJoin('users', 'users.id', '=', 'members.user_id')
            ->leftJoin('license_plans', 'license_plans.id', '=', 'members.license_plan_id')
            ->select('members.*');

        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                $q->where('members.company_name', 'like', '%'.$search.'%')
                    ->orWhereHas('user', function ($uq) use ($search): void {
                        $uq->where('email', 'like', '%'.$search.'%')
                            ->orWhere('name', 'like', '%'.$search.'%');
                    });
            });
        }

        $sortColumn = match ($sf) {
            'owner_name' => 'users.name',
            'owner_email' => 'users.email',
            'license_plan_name' => 'license_plans.name',
            default => $sf === 'id' ? 'members.id' : 'members.'.$sf,
        };

        $query->orderBy($sortColumn, $sd)->orderBy('members.id');

        $paginator = $query->paginate($perPage)->withQueryString();

        $paginator->setCollection(
            $paginator->getCollection()->map(static fn (Member $m): array => [
                'id' => $m->id,
                'company_name' => $m->company_name,
                'company_vat' => $m->company_vat,
                'max_customers' => $m->max_customers,
                'max_sub_members' => $m->max_sub_members,
                'subscription_status' => $m->subscription_status,
                'user' => [
                    'id' => $m->user->id,
                    'name' => $m->user->name,
                    'email' => $m->user->email,
                    'is_active' => (bool) $m->user->is_active,
                ],
                'license_plan' => $m->licensePlan
                    ? [
                        'id' => $m->licensePlan->id,
                        'name' => $m->licensePlan->name,
                        'slug' => $m->licensePlan->slug,
                    ]
                    : null,
                'created_at' => $m->created_at?->toIso8601String(),
                'updated_at' => $m->updated_at?->toIso8601String(),
            ]),
        );

        return Inertia::render('Accounts/Index', [
            'accounts' => [
                'data' => $paginator->items(),
                'pagination' => $this->inertiaTablePaginationMeta($paginator),
            ],
            'filters' => [
                'search' => $search,
                'sort_field' => $sf,
                'sort_order' => $sd,
            ],
        ]);
    }

    public function create(): InertiaResponse
    {
        return Inertia::render('Accounts/Create', [
            'licensePlans' => LicensePlan::query()->active()->ordered()->get(['id', 'name', 'slug', 'max_customers', 'max_sub_members']),
        ]);
    }

    public function store(StoreAccountRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $plan = isset($validated['license_plan_id'])
            ? LicensePlan::query()->find($validated['license_plan_id'])
            : null;

        DB::transaction(function () use ($validated, $plan): void {
            $user = User::query()->create([
                'name' => $validated['owner_name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'user_type' => 'member',
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            $role = \Spatie\Permission\Models\Role::query()->where('name', 'member_owner')->first();
            if ($role) {
                $user->syncRoles(['member_owner']);
            }

            $member = Member::query()->create([
                'user_id' => $user->id,
                'parent_member_id' => null,
                'license_plan_id' => $plan?->id,
                'is_owner' => true,
                'company_name' => $validated['company_name'],
                'company_vat' => $validated['company_vat'] ?? null,
                'subscription_status' => $validated['subscription_status'] ?? 'active',
                'max_customers' => array_key_exists('max_customers', $validated) && $validated['max_customers'] !== null
                    ? $validated['max_customers']
                    : $plan?->max_customers,
                'max_sub_members' => array_key_exists('max_sub_members', $validated) && $validated['max_sub_members'] !== null
                    ? $validated['max_sub_members']
                    : $plan?->max_sub_members,
            ]);

            $this->attachCustomersModule($member);
        });

        return redirect()->route('accounts.index')->with('success', __('Account creato.'));
    }

    public function show(Member $account): InertiaResponse
    {
        $account->load([
            'user:id,name,email,is_active,email_verified_at,created_at',
            'licensePlan:id,name,slug,description,max_customers,max_sub_members',
            'modules:id,slug,name,description',
        ]);

        return Inertia::render('Accounts/Show', [
            'account' => [
                'id' => $account->id,
                'company_name' => $account->company_name,
                'company_vat' => $account->company_vat,
                'license_plan_id' => $account->license_plan_id,
                'max_customers' => $account->max_customers,
                'max_sub_members' => $account->max_sub_members,
                'subscription_status' => $account->subscription_status,
                'created_at' => $account->created_at?->toIso8601String(),
                'updated_at' => $account->updated_at?->toIso8601String(),
                'license_plan' => $account->licensePlan
                    ? [
                        'id' => $account->licensePlan->id,
                        'name' => $account->licensePlan->name,
                        'slug' => $account->licensePlan->slug,
                        'description' => $account->licensePlan->description,
                        'plan_max_customers' => $account->licensePlan->max_customers,
                        'plan_max_sub_members' => $account->licensePlan->max_sub_members,
                    ]
                    : null,
                'owner' => [
                    'name' => $account->user->name,
                    'email' => $account->user->email,
                    'is_active' => $account->user->is_active,
                    'email_verified_at' => $account->user->email_verified_at?->toIso8601String(),
                    'created_at' => $account->user->created_at?->toIso8601String(),
                ],
                'counts' => [
                    'customers' => Customer::withoutGlobalScopes()->where('member_id', $account->id)->count(),
                    'sub_members' => $account->subMembers()->count(),
                ],
                'modules' => $account->modules->map(fn ($m) => [
                    'id' => $m->id,
                    'slug' => $m->slug,
                    'name' => $m->name,
                    'status' => $m->pivot->status,
                    'starts_at' => $m->pivot->starts_at
                        ? \Illuminate\Support\Carbon::parse($m->pivot->starts_at)->toIso8601String()
                        : null,
                    'ends_at' => $m->pivot->ends_at
                        ? \Illuminate\Support\Carbon::parse($m->pivot->ends_at)->toIso8601String()
                        : null,
                ])->values()->all(),
            ],
        ]);
    }

    public function edit(Member $account): InertiaResponse
    {
        $account->load(['user:id,name,email,is_active', 'licensePlan:id,name,slug']);

        return Inertia::render('Accounts/Edit', [
            'account' => [
                'id' => $account->id,
                'company_name' => $account->company_name,
                'company_vat' => $account->company_vat,
                'license_plan_id' => $account->license_plan_id,
                'max_customers' => $account->max_customers,
                'max_sub_members' => $account->max_sub_members,
                'subscription_status' => $account->subscription_status,
            ],
            'owner' => [
                'name' => $account->user->name,
                'email' => $account->user->email,
            ],
            'licensePlans' => LicensePlan::query()->active()->ordered()->get(['id', 'name', 'slug', 'max_customers', 'max_sub_members']),
        ]);
    }

    public function update(UpdateAccountRequest $request, Member $account): RedirectResponse
    {
        $validated = $request->validated();
        $saveRedirect = $validated['save_redirect'] ?? 'list';
        unset($validated['save_redirect']);

        $plan = isset($validated['license_plan_id'])
            ? LicensePlan::query()->find($validated['license_plan_id'])
            : null;

        DB::transaction(function () use ($account, $validated, $plan): void {
            $account->user->update([
                'name' => $validated['owner_name'],
                'email' => $validated['email'],
            ]);

            if (! empty($validated['password'])) {
                $account->user->update([
                    'password' => Hash::make($validated['password']),
                ]);
            }

            $account->update([
                'company_name' => $validated['company_name'],
                'company_vat' => $validated['company_vat'] ?? null,
                'license_plan_id' => $plan?->id,
                'subscription_status' => $validated['subscription_status'] ?? $account->subscription_status,
                'max_customers' => array_key_exists('max_customers', $validated)
                    ? $validated['max_customers']
                    : $account->max_customers,
                'max_sub_members' => array_key_exists('max_sub_members', $validated)
                    ? $validated['max_sub_members']
                    : $account->max_sub_members,
            ]);
        });

        if ($saveRedirect === 'stay') {
            return redirect()->route('accounts.edit', $account)->with('success', __('Account aggiornato.'));
        }

        return redirect()->route('accounts.index')->with('success', __('Account aggiornato.'));
    }

    public function destroy(Member $account): RedirectResponse
    {
        $hasCustomers = Customer::withoutGlobalScopes()
            ->where('member_id', $account->id)
            ->exists();

        if ($hasCustomers) {
            throw ValidationException::withMessages([
                'account' => [__('Impossibile eliminare: ci sono clienti associati a questo account.')],
            ]);
        }

        if ($account->subMembers()->exists()) {
            throw ValidationException::withMessages([
                'account' => [__('Impossibile eliminare: ci sono sub-member collegati.')],
            ]);
        }

        DB::transaction(function () use ($account): void {
            $user = $account->user;
            $account->delete();
            $user?->delete();
        });

        return redirect()->route('accounts.index')->with('success', __('Account eliminato.'));
    }

    public function toggleActive(Member $account): RedirectResponse
    {
        $this->authorize('update', $account);

        $user = $account->user;
        if (! $user) {
            abort(404);
        }

        $user->update(['is_active' => ! $user->is_active]);

        return redirect()
            ->route('accounts.index')
            ->with('success', __('Stato accesso owner aggiornato.'));
    }

    protected function attachCustomersModule(Member $member): void
    {
        $module = Module::query()->where('slug', 'customers')->first();
        if (! $module) {
            return;
        }

        $member->modules()->syncWithoutDetaching([
            $module->id => [
                'status' => 'active',
                'starts_at' => now(),
                'ends_at' => null,
            ],
        ]);
    }
}
