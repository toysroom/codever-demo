<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        DB::table('permissions')
            ->where('name', 'settings.tenants.index')
            ->where('guard_name', 'web')
            ->update(['name' => 'settings.accounts.index']);

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissionTableNames = config('permission.table_names');
        if (! empty($permissionTableNames['roles']) && Schema::hasColumn($permissionTableNames['roles'], 'is_active')) {
            Schema::table($permissionTableNames['roles'], static function (Blueprint $table): void {
                $table->dropColumn('is_active');
            });
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
        }

        // Creare ruoli (in ordine di priorità: admin è il primo)
        $roles = [
            'admin',          // Admin vede tutto, bypass account isolation
            'member_owner',   // Member Owner dell’account
            'sub_member',     // Sub-Member con permessi limitati
            'customer',       // Customer con accesso molto limitato
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(
                ['name' => $roleName, 'guard_name' => 'web'],
            );
        }

        $accountPermissions = [
            'dashboard.index',
            'email_notifications.index',
            'customers.index',
            'customers.show',
            'customers.create',
            'customers.update',
            'customers.delete',
            'customer_types.index',
            'customer_types.show',
            'customer_types.create',
            'customer_types.update',
            'customer_types.delete',
            'companies.index',
            'companies.show',
            'companies.create',
            'companies.update',
            'companies.delete',
            'price_lists.index',
            'price_lists.show',
            'price_lists.create',
            'price_lists.update',
            'price_lists.delete',
            'product_categories.index',
            'product_categories.show',
            'product_categories.create',
            'product_categories.update',
            'product_categories.delete',
            'products.index',
            'products.show',
            'products.create',
            'products.update',
            'products.delete',
            'web_domains.index',
            'web_domains.show',
            'web_domains.create',
            'web_domains.update',
            'web_domains.delete',
            'web_hosting_providers.index',
            'web_hosting_providers.show',
            'web_hosting_providers.create',
            'web_hosting_providers.update',
            'web_hosting_providers.delete',
            'web_servers.index',
            'web_servers.show',
            'web_servers.create',
            'web_servers.update',
            'web_servers.delete',
        ];

        $adminOnlyPermissions = [
            'settings.users.index',
            'settings.roles.index',
            'settings.permissions.index',
            'settings.preferences.index',
            'settings.modules.index',
            'settings.accounts.index',
            'settings.license_plans.index',
            'settings.logs.index',
            'settings.system.index',
            'settings.backup.index',
        ];

        $allPermissionNames = array_merge($accountPermissions, $adminOnlyPermissions);

        foreach ($allPermissionNames as $permissionName) {
            Permission::firstOrCreate(
                ['name' => $permissionName, 'guard_name' => 'web'],
            );
        }

        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole) {
            $adminRole->syncPermissions($allPermissionNames);
        }

        $memberOwnerRole = Role::where('name', 'member_owner')->first();
        if ($memberOwnerRole) {
            $memberOwnerRole->syncPermissions($accountPermissions);
        }

        $subMemberRole = Role::where('name', 'sub_member')->first();
        if ($subMemberRole) {
            $subMemberRole->syncPermissions($accountPermissions);
        }
    }
}
