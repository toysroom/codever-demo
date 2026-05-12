<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Customer;
use App\Models\LicensePlan;
use App\Models\Member;
use App\Models\Module;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Un utente di test per ogni ruolo (password comune: {@see TestRoleUsersSeeder::PASSWORD}).
 */
class TestRoleUsersSeeder extends Seeder
{
    public const PASSWORD = 'test';

    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $plan = LicensePlan::query()->where('slug', 'free')->first();
        $password = Hash::make(self::PASSWORD);

        // 1) Member owner (account di riferimento per sub-member e customer)
        $ownerUser = User::withoutGlobalScopes()->updateOrCreate(
            ['email' => 'test.owner@zelante.local'],
            [
                'name' => 'Test Member Owner',
                'password' => $password,
                'user_type' => 'member',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $ownerMember = Member::query()->updateOrCreate(
            ['user_id' => $ownerUser->id],
            [
                'parent_member_id' => null,
                'license_plan_id' => $plan?->id,
                'is_owner' => true,
                'company_name' => 'Account Test Ruoli',
                'subscription_status' => 'active',
                'max_customers' => $plan?->max_customers,
                'max_sub_members' => $plan?->max_sub_members,
            ]
        );

        $this->syncRoles($ownerUser, 'member_owner');
        $this->attachCustomersModule($ownerMember);
        $this->attachProductsModule($ownerMember);

        // 2) Admin (Account + ruolo admin)
        $adminUser = User::withoutGlobalScopes()->updateOrCreate(
            ['email' => 'test.admin@zelante.local'],
            [
                'name' => 'Test Admin',
                'password' => $password,
                'user_type' => 'admin',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $this->syncRoles($adminUser, 'admin');
        Account::query()->updateOrCreate(
            ['user_id' => $adminUser->id],
            [
                'first_name' => 'Test',
                'last_name' => 'Admin',
                'department' => 'QA',
                'role_level' => 'admin',
                'notes' => 'Utente seed ruolo admin',
            ]
        );

        // 3) Sub-member (stesso account del member owner)
        $subUser = User::withoutGlobalScopes()->updateOrCreate(
            ['email' => 'test.submember@zelante.local'],
            [
                'name' => 'Test Sub Member',
                'password' => $password,
                'user_type' => 'sub_member',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        Member::query()->updateOrCreate(
            ['user_id' => $subUser->id],
            [
                'parent_member_id' => $ownerMember->id,
                'license_plan_id' => null,
                'is_owner' => false,
                'first_name' => 'Test',
                'last_name' => 'SubMember',
                'permissions' => [
                    'domains' => [
                        'dashboard' => ['index' => true],
                        'customers' => [
                            'index' => true,
                            'show' => true,
                            'create' => true,
                            'update' => true,
                            'delete' => true,
                        ],
                        'customer_types' => [
                            'index' => true,
                            'show' => true,
                            'create' => true,
                            'update' => true,
                            'delete' => true,
                        ],
                        'companies' => [
                            'index' => true,
                            'show' => true,
                            'create' => true,
                            'update' => true,
                            'delete' => true,
                        ],
                        'price_lists' => [
                            'index' => true,
                            'show' => true,
                            'create' => true,
                            'update' => true,
                            'delete' => true,
                        ],
                        'product_categories' => [
                            'index' => true,
                            'show' => true,
                            'create' => true,
                            'update' => true,
                            'delete' => true,
                        ],
                        'products' => [
                            'index' => true,
                            'show' => true,
                            'create' => true,
                            'update' => true,
                            'delete' => true,
                        ],
                    ],
                ],
            ]
        );
        $this->syncRoles($subUser, 'sub_member');

        // 4) Customer (collegato al member owner)
        $customerUser = User::withoutGlobalScopes()->updateOrCreate(
            ['email' => 'test.customer@zelante.local'],
            [
                'name' => 'Test Customer',
                'password' => $password,
                'user_type' => 'customer',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        Customer::query()->updateOrCreate(
            ['user_id' => $customerUser->id],
            [
                'member_id' => $ownerMember->id,
                'first_name' => 'Test',
                'last_name' => 'Customer',
                'phone' => null,
                'address' => null,
            ]
        );
        $this->syncRoles($customerUser, 'customer');
    }

    protected function syncRoles(User $user, string $roleName): void
    {
        $role = Role::query()->where('name', $roleName)->first();
        if ($role) {
            $user->syncRoles([$roleName]);
        }
    }

    protected function attachCustomersModule(Member $ownerMember): void
    {
        $module = Module::query()->where('slug', 'customers')->first();
        if (! $module) {
            return;
        }

        $ownerMember->modules()->syncWithoutDetaching([
            $module->id => [
                'status' => 'active',
                'starts_at' => now(),
                'ends_at' => null,
            ],
        ]);
    }

    protected function attachProductsModule(Member $ownerMember): void
    {
        $module = Module::query()->where('slug', 'products')->first();
        if (! $module) {
            return;
        }

        $ownerMember->modules()->syncWithoutDetaching([
            $module->id => [
                'status' => 'active',
                'starts_at' => now(),
                'ends_at' => null,
            ],
        ]);
    }
}
