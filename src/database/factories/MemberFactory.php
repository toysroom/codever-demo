<?php

namespace Database\Factories;

use App\Models\Member;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Member>
 */
class MemberFactory extends Factory
{
    protected $model = Member::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state([
                'user_type' => 'member',
            ]),
            'parent_member_id' => null,
            'license_plan_id' => null,
            'is_owner' => true,
            'company_name' => fake()->company(),
            'subscription_status' => 'active',
        ];
    }
}
