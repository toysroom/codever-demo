<?php

use App\Models\Member;
use App\Models\Module;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\ModuleSeeder;
use Database\Seeders\RoleSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Activitylog\Models\Activity;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->seed(ModuleSeeder::class);
});

test('product edit page exposes change history with field diff after update', function () {
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

    $product = Product::factory()->create([
        'member_id' => $member->id,
        'name' => 'Nome iniziale',
    ]);

    $this->actingAs($ownerUser)
        ->put(route('modules.products.prodotti.update', $product), [
            'member_id' => $member->id,
            'product_category_id' => null,
            'code' => $product->code,
            'name' => 'Nome aggiornato',
            'invoice_text' => null,
            'revenue_code' => null,
            'revenue_description' => null,
            'sales_code' => null,
            'sales_description' => null,
            'line_kind' => null,
            'sort_order' => 0,
            'save_redirect' => 'stay',
        ])
        ->assertRedirect();

    $product->refresh();
    expect($product->name)->toBe('Nome aggiornato');

    expect(
        Activity::query()
            ->where('subject_type', Product::class)
            ->where('subject_id', $product->id)
            ->where('event', 'updated')
            ->exists(),
    )->toBeTrue();

    $this->actingAs($ownerUser)
        ->get(route('modules.products.prodotti.edit', $product))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('modules/products/prodotti/edit')
            ->where('product.name', 'Nome aggiornato')
            ->where('productHasChangeHistory', true)
            ->has('productChangeHistory')
            ->where('productChangeHistory.0.summary', 'Prodotto modificato'));
});

test('product edit page hides change history icon when only creation is logged', function () {
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

    $product = Product::factory()->create([
        'member_id' => $member->id,
        'name' => 'Solo creazione',
    ]);

    $this->actingAs($ownerUser)
        ->get(route('modules.products.prodotti.edit', $product))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('modules/products/prodotti/edit')
            ->where('productHasChangeHistory', false));
});
