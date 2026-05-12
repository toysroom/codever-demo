<?php

namespace Database\Factories;

use App\Models\Member;
use App\Models\ProductCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductCategory>
 */
class ProductCategoryFactory extends Factory
{
    protected $model = ProductCategory::class;

    public function definition(): array
    {
        return [
            'member_id' => Member::factory(),
            'parent_id' => null,
            'name' => fake()->unique()->word(),
            'sort_order' => 0,
        ];
    }
}
