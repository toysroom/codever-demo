<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Member;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Company>
 */
class CompanyFactory extends Factory
{
    protected $model = Company::class;

    public function definition(): array
    {
        return [
            'member_id' => Member::factory(),
            'name' => fake()->company(),
            'legal_name' => null,
            'vat_number' => null,
            'email' => fake()->boolean(70) ? fake()->safeEmail() : null,
            'phone' => fake()->optional()->phoneNumber(),
            'pec' => null,
            'sdi_recipient_code' => null,
            'address' => fake()->optional()->streetAddress(),
            'city' => fake()->optional()->city(),
            'postal_code' => fake()->optional()->postcode(),
            'province' => null,
            'country' => 'IT',
            'notes' => null,
            'is_default' => false,
        ];
    }

    public function defaultCompany(): static
    {
        return $this->state(fn (): array => ['is_default' => true]);
    }
}
