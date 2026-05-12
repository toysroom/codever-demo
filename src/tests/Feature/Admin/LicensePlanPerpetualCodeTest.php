<?php

use App\Models\LicensePlan;
use App\Models\LicensePlanPerpetualCode;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

test('admin can create perpetual license code for a plan', function () {
    $user = User::factory()->create([
        'user_type' => 'admin',
    ]);
    $user->assignRole('admin');

    $plan = LicensePlan::query()->create([
        'name' => 'Test Basic',
        'slug' => 'test-basic-'.uniqid(),
        'package_tier' => null,
        'price' => 100,
        'billing_period' => 'yearly',
        'annual_term_months' => 12,
        'trial_days' => 0,
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->post(
        route('license-plans.perpetual-codes.store', $plan),
        [
            'code' => 'ACME-PERP-01',
            'notes' => 'Cliente speciale',
            'is_active' => true,
        ]
    );

    $response->assertRedirect(route('license-plans.show', $plan));

    $stored = LicensePlanPerpetualCode::query()->where('license_plan_id', $plan->id)->first();
    expect($stored)->not->toBeNull()
        ->and($stored->code)->toBe('ACME-PERP-01');
});

test('admin can delete perpetual license code', function () {
    $user = User::factory()->create([
        'user_type' => 'admin',
    ]);
    $user->assignRole('admin');

    $plan = LicensePlan::query()->create([
        'name' => 'Test Plan',
        'slug' => 'test-plan-'.uniqid(),
        'package_tier' => null,
        'annual_term_months' => 12,
        'trial_days' => 0,
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $code = LicensePlanPerpetualCode::query()->create([
        'license_plan_id' => $plan->id,
        'code' => 'DEL-TEST-01',
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->delete(
        route('license-plans.perpetual-codes.destroy', ['license_plan' => $plan, 'perpetual_code' => $code])
    );

    $response->assertRedirect(route('license-plans.show', $plan));
    expect(LicensePlanPerpetualCode::query()->find($code->id))->toBeNull();
});
