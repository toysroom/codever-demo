<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\RoleMetadata;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Spatie\Permission\Models\Permission;

class SettingsRolesController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $perPage = (int) $request->query('per_page', 50);
        $perPage = in_array($perPage, [15, 25, 50, 100], true) ? $perPage : 50;

        $query = Role::query()->with(['metadata', 'permissions', 'users']);

        if ($search = $request->query('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $sortField = $request->query('sort_field', 'priority');
        $sortOrder = $request->query('sort_order', 'desc') === 'desc' ? 'desc' : 'asc';
        if ($sortField === 'priority') {
            $query
                ->leftJoin('role_metadata', 'role_metadata.role_id', '=', 'roles.id')
                ->select('roles.*')
                ->orderBy('role_metadata.priority', $sortOrder)
                ->orderBy('roles.name', 'asc');
        } else {
            $query->orderBy(in_array($sortField, ['name', 'created_at', 'updated_at'], true) ? $sortField : 'name', $sortOrder);
        }

        /** @var LengthAwarePaginator<Role> $paginator */
        $paginator = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Roles/Index', [
            'roles' => [
                'data' => $paginator->getCollection()->map(fn (Role $r) => $this->roleRow($r))->values()->all(),
                'pagination' => $this->paginationMeta($paginator),
            ],
            'permissions' => Permission::query()->orderBy('name')->get()->map(fn (Permission $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'category' => explode('.', $p->name)[0] ?? 'Other',
                'description' => '',
                'guard_name' => $p->guard_name,
            ]),
            'filters' => [
                'search' => (string) $request->query('search', ''),
                'sort_field' => (string) $sortField,
                'sort_order' => (string) $sortOrder,
            ],
            'can' => [
                'role_create' => true,
                'role_show' => true,
                'role_edit' => true,
                'role_destroy' => true,
                'role_export' => true,
                'role_toggle_active' => true,
            ],
            'lang' => $this->rolesLang(),
        ]);
    }

    public function create(): InertiaResponse
    {
        return Inertia::render('Roles/Create', [
            'permissions' => Permission::query()->orderBy('name')->get()->map(fn (Permission $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'category' => explode('.', $p->name)[0] ?? 'Other',
                'description' => '',
                'guard_name' => $p->guard_name,
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
            'permissions' => ['array'],
            'permissions.*' => ['integer', 'exists:permissions,id'],
            'save_redirect' => ['nullable', 'in:stay,list'],
        ]);

        $role = Role::query()->create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        $role->syncPermissions(Permission::query()->whereIn('id', $validated['permissions'] ?? [])->pluck('name'));

        if (($validated['save_redirect'] ?? 'list') === 'list') {
            return redirect()->route('roles.index')->with('success', 'Role created.');
        }

        return redirect()->route('roles.edit', $role)->with('success', 'Role created.');
    }

    public function show(Role $role): InertiaResponse
    {
        $role->load(['metadata', 'permissions', 'users']);

        return Inertia::render('Roles/Show', [
            'role' => $this->roleDetail($role),
            'can' => [
                'role_edit' => true,
                'role_destroy' => true,
            ],
        ]);
    }

    public function edit(Role $role): InertiaResponse
    {
        $role->load(['metadata', 'permissions']);

        return Inertia::render('Roles/Edit', [
            'role' => $this->roleDetail($role),
            'permissions' => Permission::query()->orderBy('name')->get()->map(fn (Permission $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'category' => explode('.', $p->name)[0] ?? 'Other',
                'description' => '',
                'guard_name' => $p->guard_name,
            ]),
            'lang' => [
                'save' => 'Save',
                'save_and_back_to_list' => 'Save and back to list',
                'toggle_failed' => 'Could not toggle role.',
            ],
        ]);
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name,'.$role->id],
            'permissions' => ['array'],
            'permissions.*' => ['integer', 'exists:permissions,id'],
            'save_redirect' => ['nullable', 'in:stay,list'],
        ]);

        $role->update(['name' => $validated['name']]);
        $role->syncPermissions(Permission::query()->whereIn('id', $validated['permissions'] ?? [])->pluck('name'));

        if (($validated['save_redirect'] ?? 'stay') === 'list') {
            return redirect()->route('roles.index')->with('success', 'Role updated.');
        }

        return redirect()->back()->with('success', 'Role updated.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        if (in_array($role->name, ['admin', 'customer', 'member_owner', 'sub_member'], true)) {
            return redirect()->back()->with('error', 'System roles cannot be deleted.');
        }

        $role->delete();

        return redirect()->route('roles.index')->with('success', 'Role deleted.');
    }

    public function toggleActive(Role $role): RedirectResponse
    {
        if (in_array($role->name, ['admin', 'customer'], true)) {
            return redirect()->back()->with('error', 'System roles cannot be toggled.');
        }

        $meta = $this->ensureRoleMetadata($role);

        if ($meta->is_disabled) {
            return redirect()->back()->with('error', 'This role cannot be activated or deactivated.');
        }

        $meta->update(['is_active' => ! $meta->is_active]);

        return redirect()->back()->with('success', 'Role status updated.');
    }

    public function export(Request $request): Response
    {
        $filename = 'roles-export.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $that = $this;
        $callback = static function () use ($request, $that): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['id', 'name', 'priority', 'is_active', 'is_disabled', 'description']);
            Role::query()
                ->with('metadata')
                ->when($request->query('search'), fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
                ->orderBy('id')
                ->each(function (Role $r) use ($handle, $that): void {
                    $meta = $that->ensureRoleMetadata($r);
                    fputcsv($handle, [
                        $r->id,
                        $r->name,
                        $meta->priority,
                        $meta->is_active ? '1' : '0',
                        $meta->is_disabled ? '1' : '0',
                        $meta->description ?? '',
                    ]);
                });
            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * @return array<string, mixed>
     */
    private function roleRow(Role $role): array
    {
        $meta = $this->ensureRoleMetadata($role);
        $systemDelete = in_array($role->name, ['admin', 'customer', 'member_owner', 'sub_member'], true);

        return [
            'id' => $role->id,
            'name' => $role->name,
            'created_at' => $role->created_at?->toIso8601String(),
            'updated_at' => $role->updated_at?->toIso8601String(),
            'permissions' => $role->permissions->map(fn (Permission $p) => [
                'id' => $p->id,
                'name' => $p->name,
            ])->values()->all(),
            'users' => $role->users->take(50)->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
            ])->values()->all(),
            'active' => $meta->is_active,
            'is_active' => $meta->is_active,
            'is_disabled' => $meta->is_disabled,
            'is_deleteble' => ! $systemDelete,
            'priority' => $meta->priority,
            'description' => $meta->description ?? '',
        ];
    }

    private function ensureRoleMetadata(Role $role): RoleMetadata
    {
        if ($role->relationLoaded('metadata') && $role->metadata !== null) {
            return $role->metadata;
        }

        /** @var RoleMetadata $meta */
        $meta = RoleMetadata::query()->firstOrCreate(
            ['role_id' => $role->id],
            [
                'is_active' => true,
                'is_disabled' => in_array($role->name, ['admin', 'customer'], true),
                'priority' => Role::defaultPriorityForName($role->name),
                'description' => null,
            ],
        );

        $role->setRelation('metadata', $meta);

        return $meta;
    }

    /**
     * @return array<string, mixed>
     */
    private function roleDetail(Role $role): array
    {
        $row = $this->roleRow($role);

        return array_merge($row, [
            'permissions' => $role->permissions->map(fn (Permission $p) => [
                'id' => $p->id,
                'name' => $p->name,
            ])->values()->all(),
            'users' => $role->users->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
            ])->values()->all(),
        ]);
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
    private function rolesLang(): array
    {
        return [
            'breadcrumb_dashboard' => 'Dashboard',
            'breadcrumb_roles' => 'Roles',
            'index_title' => 'Roles',
            'index_description' => 'Manage roles and permissions.',
            'column_description' => 'Description',
            'column_priority' => 'Priority',
            'create_button' => 'Create role',
            'search_placeholder' => 'Search roles…',
            'search_help' => 'Filter by role name.',
            'empty' => 'No roles found.',
            'customize_columns_button' => 'Columns',
            'delete_dialog_title' => 'Delete role?',
            'delete_dialog_description' => 'This will remove the role',
            'delete_dialog_fallback' => 'this role',
            'delete_dialog_confirm' => 'Delete',
            'toggle_failed' => 'Could not toggle role.',
        ];
    }
}
