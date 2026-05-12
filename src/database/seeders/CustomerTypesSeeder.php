<?php

namespace Database\Seeders;

use App\Models\CustomerType;
use App\Models\Member;
use Illuminate\Database\Seeder;

/**
 * Crea per ogni Member owner i tipi cliente standard (anagrafica modulo customers).
 *
 * Usati anche da {@see RubricaCustomersSeeder} in base alla colonna "Tipo" del CSV.
 */
class CustomerTypesSeeder extends Seeder
{
    public function run(): void
    {
        Member::query()->owners()->orderBy('id')->each(function (Member $member): void {
            CustomerType::withoutGlobalScopes()->firstOrCreate(
                ['member_id' => $member->id, 'name' => 'Cliente'],
                ['description' => null, 'sort_order' => 1, 'is_active' => true]
            );
            CustomerType::withoutGlobalScopes()->firstOrCreate(
                ['member_id' => $member->id, 'name' => 'Fornitore'],
                ['description' => null, 'sort_order' => 2, 'is_active' => true]
            );
        });
    }
}
