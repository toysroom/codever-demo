<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /** @var list<array{email: string, name: string, account: array{first_name: string, last_name: string, department: string, notes: string}}> $definitions */
        $definitions = [
            [
                'email' => 'admin@admin.com',
                'name' => 'Admin',
                'account' => [
                    'first_name' => 'Admin',
                    'last_name' => 'System',
                    'department' => 'IT',
                    'notes' => 'Amministratore principale del sistema',
                ],
            ],
            [
                'email' => 'admin@zelante.it',
                'name' => 'Admin Zelante',
                'account' => [
                    'first_name' => 'Admin',
                    'last_name' => 'Zelante',
                    'department' => 'IT',
                    'notes' => 'Amministratore Zelante (permessi completi)',
                ],
            ],
        ];

        foreach ($definitions as $def) {
            // Usa withoutGlobalScopes() per evitare problemi con SoftDeletes se la colonna non esiste ancora
            $admin = User::withoutGlobalScopes()->updateOrCreate(
                ['email' => $def['email']],
                [
                    'name' => $def['name'],
                    'password' => Hash::make('pippo'),
                    'user_type' => 'admin',
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );

            $adminRole = Role::query()->where('name', 'admin')->first();
            if ($adminRole) {
                $admin->syncRoles(['admin']);
            }

            Account::updateOrCreate(
                ['user_id' => $admin->id],
                [
                    'first_name' => $def['account']['first_name'],
                    'last_name' => $def['account']['last_name'],
                    'department' => $def['account']['department'],
                    'role_level' => 'super_admin',
                    'notes' => $def['account']['notes'],
                ]
            );
        }
    }
}
