<?php

namespace Database\Factories;

use App\Models\Member;
use App\Models\PriceList;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PriceList>
 */
class PriceListFactory extends Factory
{
    protected $model = PriceList::class;

    public function definition(): array
    {
        return [
            'member_id' => Member::factory(),
            'name' => fake()->words(2, true).' listino',
            'code' => strtoupper(fake()->unique()->lexify('LST???')),
            'currency' => 'EUR',
            'valid_from' => null,
            'valid_to' => null,
            'is_default' => false,
            'notes' => null,
        ];
    }
}
