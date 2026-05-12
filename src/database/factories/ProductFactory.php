<?php

namespace Database\Factories;

use App\Models\Member;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'member_id' => Member::factory(),
            'product_category_id' => null,
            'code' => strtoupper(fake()->unique()->bothify('PRD-####')),
            'name' => fake()->words(3, true),
            'invoice_text' => null,
            'revenue_code' => null,
            'revenue_description' => null,
            'sales_code' => null,
            'sales_description' => null,
            'line_kind' => null,
            'sort_order' => 0,
        ];
    }

    public function withCategory(ProductCategory $category): static
    {
        return $this->state(fn (array $attributes) => [
            'member_id' => $category->member_id,
            'product_category_id' => $category->id,
        ]);
    }
}
