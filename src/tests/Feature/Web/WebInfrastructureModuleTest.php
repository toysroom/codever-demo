<?php

use App\Models\Member;
use App\Models\User;
use App\Models\WebHostingProvider;
use App\Models\WebServer;
use Database\Seeders\ModuleSeeder;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->seed(ModuleSeeder::class);
});

test('admin can create hosting provider then server linked to provider', function () {
    $user = User::factory()->create([
        'user_type' => 'admin',
    ]);
    $user->assignRole('admin');

    $member = Member::factory()->create();

    $this->actingAs($user)->post(route('modules.web.hosting-providers.store'), [
        'name' => 'Serverplan QA',
        'slug' => 'serverplan-qa-test',
        'website_url' => 'https://www.example.com/',
    ])->assertRedirect(route('modules.web.hosting-providers.index'));

    $providerId = WebHostingProvider::query()->where('slug', 'serverplan-qa-test')->value('id');
    expect($providerId)->not->toBeNull();

    $this->actingAs($user)->post(route('modules.web.servers.store'), [
        'member_id' => $member->id,
        'web_hosting_provider_id' => $providerId,
        'host' => '89.46.226.31',
        'label' => 'QA',
        'notes' => null,
    ])->assertRedirect(route('modules.web.servers.index'));

    expect(WebServer::withoutGlobalScopes()->where('member_id', $member->id)->count())->toBe(1);
});

test('cannot delete hosting provider while servers reference it', function () {
    $user = User::factory()->create([
        'user_type' => 'admin',
    ]);
    $user->assignRole('admin');

    $member = Member::factory()->create();

    /** @var WebHostingProvider $provider */
    $provider = WebHostingProvider::query()->create([
        'slug' => 'prov-x',
        'name' => 'Prov X',
    ]);

    WebServer::withoutGlobalScopes()->create([
        'member_id' => $member->id,
        'web_hosting_provider_id' => $provider->id,
        'host' => '1.2.3.4',
        'label' => null,
        'notes' => null,
    ]);

    $response = $this->actingAs($user)->from(route('modules.web.hosting-providers.index'))->delete(
        route('modules.web.hosting-providers.destroy', $provider->id),
    );

    expect(WebHostingProvider::query()->whereKey($provider->id)->exists())->toBeTrue();
    $response->assertSessionHas('error');
});
