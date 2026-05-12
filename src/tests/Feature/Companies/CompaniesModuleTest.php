<?php

use App\Models\Company;
use App\Models\Member;
use App\Models\Module;
use App\Models\User;
use Database\Seeders\ModuleSeeder;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->seed(ModuleSeeder::class);
});

test('admin can view companies index', function () {
    $user = User::factory()->create(['user_type' => 'admin']);
    $user->assignRole('admin');

    $response = $this->actingAs($user)->get(route('modules.companies.index'));

    $response->assertOk();
});

test('member owner with customers module can create company', function () {
    $ownerUser = User::factory()->create(['user_type' => 'member']);
    $ownerUser->assignRole('member_owner');
    $member = Member::factory()->create(['user_id' => $ownerUser->id]);

    $module = Module::query()->where('slug', 'customers')->first();
    $member->modules()->attach($module->id, [
        'status' => 'active',
        'starts_at' => now(),
        'ends_at' => null,
    ]);

    $response = $this->actingAs($ownerUser)->post(route('modules.companies.store'), [
        'name' => 'Acme Italia',
        'legal_name' => 'Acme Italia SRL',
        'vat_number' => 'IT12345678901',
        'country' => 'IT',
        'is_default' => true,
    ]);

    $company = Company::query()->where('member_id', $member->id)->first();
    expect($company)->not->toBeNull()
        ->and($company->name)->toBe('Acme Italia')
        ->and($company->is_default)->toBeTrue();

    $response->assertRedirect(route('modules.companies.show', $company));
});

test('setting default company clears other defaults for same member', function () {
    $ownerUser = User::factory()->create(['user_type' => 'member']);
    $ownerUser->assignRole('member_owner');
    $member = Member::factory()->create(['user_id' => $ownerUser->id]);

    $module = Module::query()->where('slug', 'customers')->first();
    $member->modules()->attach($module->id, [
        'status' => 'active',
        'starts_at' => now(),
        'ends_at' => null,
    ]);

    $first = Company::factory()->defaultCompany()->create(['member_id' => $member->id, 'name' => 'First']);
    expect($first->fresh()->is_default)->toBeTrue();

    $this->actingAs($ownerUser)->post(route('modules.companies.store'), [
        'name' => 'Second',
        'is_default' => true,
    ]);

    expect($first->fresh()->is_default)->toBeFalse()
        ->and(Company::query()->where('member_id', $member->id)->where('is_default', true)->count())->toBe(1);
});
