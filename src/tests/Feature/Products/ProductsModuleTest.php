<?php

use App\Models\Member;
use App\Models\Module;
use App\Models\PriceList;
use App\Models\User;
use Database\Seeders\ModuleSeeder;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->seed(ModuleSeeder::class);
});

test('admin can view products listini index', function () {
    $user = User::factory()->create([
        'user_type' => 'admin',
    ]);
    $user->assignRole('admin');

    $response = $this->actingAs($user)->get(route('modules.products.listini.index'));

    $response->assertOk();
});

test('admin can create price list', function () {
    $user = User::factory()->create([
        'user_type' => 'admin',
    ]);
    $user->assignRole('admin');
    $member = Member::factory()->create();

    $response = $this->actingAs($user)->post(route('modules.products.listini.store'), [
        'member_id' => $member->id,
        'name' => 'Test listino',
        'code' => 'TL1',
        'currency' => 'EUR',
        'is_default' => false,
    ]);

    $response->assertRedirect(route('modules.products.listini.index'));
    expect(PriceList::withoutGlobalScopes()->where('member_id', $member->id)->count())->toBe(1);
});

test('member owner with products module can view prodotti index', function () {
    $ownerUser = User::factory()->create([
        'user_type' => 'member',
    ]);
    $ownerUser->assignRole('member_owner');
    $member = Member::factory()->create([
        'user_id' => $ownerUser->id,
    ]);

    $module = Module::query()->where('slug', 'products')->first();
    $member->modules()->attach($module->id, [
        'status' => 'active',
        'starts_at' => now(),
        'ends_at' => null,
    ]);

    $response = $this->actingAs($ownerUser)->get(route('modules.products.prodotti.index'));

    $response->assertOk();
});
