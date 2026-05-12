<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Spatie\Permission\Models\Permission;

class SettingsUsersController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $perPage = (int) $request->query('per_page', 50);
        $perPage = in_array($perPage, [15, 25, 50, 100], true) ? $perPage : 50;

        $query = User::query()->with('roles');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $sortField = $request->query('sort_field', 'name');
        $sortOrder = $request->query('sort_order', 'asc') === 'desc' ? 'desc' : 'asc';

        if ($sortField === 'role' || $sortField === 'role_name') {
            $query->orderBy('name', $sortOrder);
        } else {
            $query->orderBy(in_array($sortField, ['name', 'email', 'created_at', 'updated_at'], true) ? $sortField : 'name', $sortOrder);
        }

        /** @var LengthAwarePaginator<User> $paginator */
        $paginator = $query->paginate($perPage)->withQueryString();

        $user = $request->user();
        $canEditCustomers = $user?->can('modules.customers.edit') ?? false;

        return Inertia::render('Users/Index', [
            'users' => [
                'data' => $paginator->getCollection()->map(fn (User $u) => $this->userRow($u, $canEditCustomers))->values()->all(),
                'pagination' => $this->paginationMeta($paginator),
            ],
            'filters' => [
                'search' => (string) $request->query('search', ''),
                'sort_field' => (string) $sortField,
                'sort_order' => (string) $sortOrder,
            ],
            'can' => [
                'user_show' => true,
                'user_create' => true,
                'user_edit' => true,
                'user_destroy' => true,
                'user_export' => true,
                'user_toggle_active' => true,
                'customer_edit' => $canEditCustomers,
            ],
            'lang' => $this->usersLang(),
        ]);
    }

    public function create(Request $request): InertiaResponse
    {
        return Inertia::render('Users/Create', [
            'roles' => Role::query()->orderBy('name')->get(['id', 'name']),
            'customers' => Customer::query()->orderBy('first_name')->limit(500)->get()->map(fn (Customer $c) => [
                'id' => $c->id,
                'name' => $c->fullName(),
                'email' => $c->user?->email ?? '',
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'roles' => ['array'],
            'roles.*' => ['integer', 'exists:roles,id'],
            'customers' => ['array'],
            'customers.*' => ['integer', 'exists:customers,id'],
            'save_redirect' => ['nullable', 'in:stay,list'],
        ]);

        $user = User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'user_type' => 'member',
            'is_active' => true,
        ]);

        $user->syncRoles(Role::query()->whereIn('id', $validated['roles'] ?? [])->pluck('name'));

        if (! empty($validated['customers'])) {
            Customer::query()->whereIn('id', $validated['customers'])->update(['user_id' => $user->id]);
        }

        if (($validated['save_redirect'] ?? 'list') === 'list') {
            return redirect()->route('users.index')->with('success', 'User created.');
        }

        return redirect()->route('users.edit', $user)->with('success', 'User created.');
    }

    public function show(User $user): InertiaResponse
    {
        $user->load(['roles', 'permissions', 'customer']);

        return Inertia::render('Users/Show', [
            'user' => $this->userDetail($user),
            'can' => [
                'user_edit' => true,
                'user_destroy' => true,
            ],
        ]);
    }

    public function edit(User $user): InertiaResponse
    {
        $user->load('roles');

        return Inertia::render('Users/Edit', [
            'user' => $this->userDetail($user),
            'roles' => Role::query()->orderBy('name')->get(['id', 'name']),
            'userRoles' => $user->roles->pluck('id')->all(),
            'customers' => Customer::query()->orderBy('first_name')->limit(500)->get()->map(fn (Customer $c) => [
                'id' => $c->id,
                'name' => $c->fullName(),
                'email' => $c->user?->email ?? '',
            ]),
            'userCustomers' => Customer::query()->where('user_id', $user->id)->pluck('id')->all(),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'roles' => ['array'],
            'roles.*' => ['integer', 'exists:roles,id'],
            'customers' => ['array'],
            'customers.*' => ['integer', 'exists:customers,id'],
            'save_redirect' => ['nullable', 'in:stay,list'],
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        $user->syncRoles(Role::query()->whereIn('id', $validated['roles'] ?? [])->pluck('name'));

        Customer::query()->where('user_id', $user->id)->update(['user_id' => null]);
        if (! empty($validated['customers'])) {
            Customer::query()->whereIn('id', $validated['customers'])->update(['user_id' => $user->id]);
        }

        if (($validated['save_redirect'] ?? 'stay') === 'list') {
            return redirect()->route('users.index')->with('success', 'User updated.');
        }

        return redirect()->back()->with('success', 'User updated.');
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->hasRole('admin')) {
            $otherAdmins = User::query()
                ->where('id', '!=', $user->id)
                ->whereHas('roles', fn ($q) => $q->where('name', 'admin'))
                ->count();
            if ($otherAdmins === 0) {
                return redirect()->back()->with('error', 'Cannot delete the last admin user.');
            }
        }

        $user->delete();

        return redirect()->route('users.index')->with('success', 'User deleted.');
    }

    public function toggleActive(User $user): RedirectResponse
    {
        $user->update(['is_active' => ! $user->is_active]);

        return redirect()->back();
    }

    public function export(Request $request): Response
    {
        $filename = 'users-export.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = static function () use ($request): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['id', 'name', 'email', 'is_active']);
            User::query()
                ->when($request->query('search'), fn ($q, $s) => $q->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%"))
                ->orderBy('id')
                ->each(function (User $u) use ($handle): void {
                    fputcsv($handle, [$u->id, $u->name, $u->email, $u->is_active ? '1' : '0']);
                });
            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * @return array<string, mixed>
     */
    private function userRow(User $user, bool $canEditCustomers): array
    {
        $customers = Customer::query()->where('user_id', $user->id)->get()->map(fn (Customer $c) => [
            'id' => $c->id,
            'name' => $c->fullName(),
        ]);

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'active' => (bool) $user->is_active,
            'is_active' => (bool) $user->is_active,
            'created_at' => $user->created_at?->toIso8601String(),
            'updated_at' => $user->updated_at?->toIso8601String(),
            'roles' => $user->roles->map(fn (Role $r) => ['id' => $r->id, 'name' => $r->name])->values()->all(),
            'customers' => $customers->values()->all(),
            'can_edit_customers' => $canEditCustomers,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function userDetail(User $user): array
    {
        $customers = Customer::query()->where('user_id', $user->id)->get()->map(fn (Customer $c) => [
            'id' => $c->id,
            'name' => $c->fullName(),
        ]);

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'active' => (bool) $user->is_active,
            'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            'created_at' => $user->created_at?->toIso8601String(),
            'updated_at' => $user->updated_at?->toIso8601String(),
            'roles' => $user->roles->map(fn (Role $r) => ['id' => $r->id, 'name' => $r->name])->values()->all(),
            'permissions' => $user->getAllPermissions()->map(fn (Permission $p) => ['id' => $p->id, 'name' => $p->name])->values()->all(),
            'customers' => $customers->values()->all(),
        ];
    }

    /**
     * @return array<string, int|null>
     */
    private function paginationMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];
    }

    /**
     * @return array<string, string>
     */
    private function usersLang(): array
    {
        return [
            'breadcrumb_dashboard' => 'Dashboard',
            'breadcrumb_users' => 'Users',
            'index_title' => 'Users',
            'index_description' => 'Manage application users.',
            'create_button' => 'Create user',
            'search_placeholder' => 'Search by name or email…',
            'search_help' => 'Filter the list by name or email.',
            'empty' => 'No users found.',
            'customize_columns_button' => 'Columns',
            'deleted_success' => 'User deleted.',
            'delete_failed' => 'Could not delete user.',
            'toggle_success' => 'User status updated.',
            'toggle_failed' => 'Could not update status.',
            'delete_dialog_title' => 'Delete user?',
            'delete_dialog_description' => 'This will remove the user',
            'delete_dialog_fallback' => 'this user',
            'delete_dialog_confirm' => 'Delete',
            'delete_dialog_cancel' => 'Cancel',
        ];
    }
}
