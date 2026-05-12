<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            LicensePlanSeeder::class,
            PreferenceSeeder::class,
            RoleSeeder::class,
            RoleMetadataSeeder::class,
            PermissionDescriptionSeeder::class,
            ModuleSeeder::class,
            AdminSeeder::class,
            DemoMemberOwnerSeeder::class,
            SyncMemberModulesSeeder::class,
            WebHostingProvidersCatalogSeeder::class,
            ToysroomDataSeeder::class,
            CustomerTypesSeeder::class,
            ListinoProductsSeeder::class,
            TestRoleUsersSeeder::class,
            RubricaCustomersSeeder::class,
        ]);
    }
}
