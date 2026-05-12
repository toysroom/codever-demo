<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        $permission = Permission::firstOrCreate(
            ['name' => 'email_notifications.index', 'guard_name' => 'web'],
        );

        foreach (['admin', 'member_owner', 'sub_member'] as $roleName) {
            $role = Role::query()->where('name', $roleName)->where('guard_name', 'web')->first();
            if ($role && ! $role->hasPermissionTo($permission)) {
                $role->givePermissionTo($permission);
            }
        }
    }

    public function down(): void
    {
        $permission = Permission::query()
            ->where('name', 'email_notifications.index')
            ->where('guard_name', 'web')
            ->first();

        if (! $permission) {
            return;
        }

        foreach (['admin', 'member_owner', 'sub_member'] as $roleName) {
            $role = Role::query()->where('name', $roleName)->where('guard_name', 'web')->first();
            if ($role) {
                $role->revokePermissionTo($permission);
            }
        }

        $permission->delete();
    }
};
