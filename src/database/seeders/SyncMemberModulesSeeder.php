<?php

namespace Database\Seeders;

use App\Models\Member;
use App\Models\Module;
use Illuminate\Database\Seeder;

class SyncMemberModulesSeeder extends Seeder
{
    /**
     * Attiva su tutti i Member owner i moduli core e quelli già definiti in catalogo.
     */
    public function run(): void
    {
        $customers = Module::query()->where('slug', 'customers')->first();
        $products = Module::query()->where('slug', 'products')->first();

        Member::query()->owners()->each(function (Member $member) use ($customers, $products): void {
            $sync = [];
            if ($customers) {
                $sync[$customers->id] = [
                    'status' => 'active',
                    'starts_at' => now(),
                    'ends_at' => null,
                ];
            }
            if ($products) {
                $sync[$products->id] = [
                    'status' => 'active',
                    'starts_at' => now(),
                    'ends_at' => null,
                ];
            }
            if ($sync !== []) {
                $member->modules()->syncWithoutDetaching($sync);
            }
        });
    }
}
