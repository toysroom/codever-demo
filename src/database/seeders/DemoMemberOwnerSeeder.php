<?php

namespace Database\Seeders;

use App\Models\LicensePlan;
use App\Models\Member;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoMemberOwnerSeeder extends Seeder
{
    /**
     * Due account membri owner commerciali di esempio.
     *
     * 1) Toysroom — credenziali chieste dall’azienda per sviluppo.
     * 2) Secondario minimale — stessa password di comodo.
     */
    public function run(): void
    {
        $plan = LicensePlan::query()->where('slug', 'free')->first();

        $accounts = [
            [
                'email' => 'info@toysroom.it',
                'password' => 'pippo',
                'name' => 'Toysroom Owner',
                'company_name' => 'Toysroom',
            ],
            [
                'email' => 'seconda@zelante.demo',
                'password' => 'pippo',
                'name' => 'Secondo account Owner',
                'company_name' => 'Account secondario',
            ],
        ];

        foreach ($accounts as $row) {
            $user = User::withoutGlobalScopes()->updateOrCreate(
                ['email' => $row['email']],
                [
                    'name' => $row['name'],
                    'password' => Hash::make($row['password']),
                    'user_type' => 'member',
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );

            $role = Role::query()->where('name', 'member_owner')->first();
            if ($role && ! $user->hasRole('member_owner')) {
                $user->syncRoles(['member_owner']);
            }

            Member::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'parent_member_id' => null,
                    'license_plan_id' => $plan?->id,
                    'is_owner' => true,
                    'company_name' => $row['company_name'],
                    'company_vat' => null,
                    'subscription_status' => 'active',
                    'max_customers' => $plan?->max_customers,
                    'max_sub_members' => $plan?->max_sub_members,
                ]
            );
        }
    }
}
