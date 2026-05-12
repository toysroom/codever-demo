<?php

use App\Models\Member;
use App\Models\Module;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\User;
use App\Modules\Products\Caching\ProductsCatalogCache;
use Database\Seeders\ModuleSeeder;
use Database\Seeders\RoleSeeder;
use Inertia\Testing\AssertableInertia as Assert;

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

test('prodotti index marks database then redis on consecutive visits', function () {
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

    app(ProductsCatalogCache::class)->store()->flush();

    $this->actingAs($ownerUser)
        ->get(route('modules.products.prodotti.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('modules/products/prodotti/index')
            ->where('productsModuleDataLayer', 'database'));

    $this->actingAs($ownerUser)
        ->get(route('modules.products.prodotti.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('productsModuleDataLayer', 'redis'));
});

test('creating a product bumps list cache so next index is database again', function () {
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

    app(ProductsCatalogCache::class)->store()->flush();

    $this->actingAs($ownerUser)
        ->get(route('modules.products.prodotti.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('productsModuleDataLayer', 'database'));

    $this->actingAs($ownerUser)
        ->get(route('modules.products.prodotti.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('productsModuleDataLayer', 'redis'));

    Product::factory()->create(['member_id' => $member->id]);

    $this->actingAs($ownerUser)
        ->get(route('modules.products.prodotti.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('productsModuleDataLayer', 'database'));
});

test('prodotti show marks database then redis on consecutive visits', function () {
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

    $product = Product::factory()->create(['member_id' => $member->id]);

    app(ProductsCatalogCache::class)->store()->flush();

    $this->actingAs($ownerUser)
        ->get(route('modules.products.prodotti.show', $product))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('modules/products/prodotti/show')
            ->where('productsModuleDataLayer', 'database'));

    $this->actingAs($ownerUser)
        ->get(route('modules.products.prodotti.show', $product))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('productsModuleDataLayer', 'redis'));
});

test('prodotti index search filters by code or name', function () {
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

    Product::factory()->create([
        'member_id' => $member->id,
        'code' => 'ZZZ-SEARCH-CODE-ABC',
        'name' => 'Irrelevant title',
    ]);
    Product::factory()->create([
        'member_id' => $member->id,
        'code' => 'OTHER-CODE',
        'name' => 'Unique Beetle Name XyZ',
    ]);

    app(ProductsCatalogCache::class)->store()->flush();

    $this->actingAs($ownerUser)
        ->get(route('modules.products.prodotti.index', ['search' => 'SEARCH-CODE']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 1)
            ->where('products.data.0.code', 'ZZZ-SEARCH-CODE-ABC')
            ->where('filters.search', 'SEARCH-CODE'));

    $this->actingAs($ownerUser)
        ->get(route('modules.products.prodotti.index', ['search' => 'Beetle Name']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Unique Beetle Name XyZ'));
});
