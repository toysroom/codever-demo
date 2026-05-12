<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

test('guests cannot visit notifications index', function () {
    $this->get(route('notifications.index'))->assertRedirect(route('login'));
});

test('legacy /notifications path redirects to inbox preserving query string', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/notifications?notification=test-id&page=2')
        ->assertRedirect(route('notifications.index', ['notification' => 'test-id', 'page' => '2']));
});

test('authenticated users can open notifications index', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('notifications.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Notifications/Index'));
});

test('visit with notification query marks that notification as read', function () {
    $user = User::factory()->create();
    $id = (string) Str::uuid();

    DB::table('notifications')->insert([
        'id' => $id,
        'type' => 'App\\Notifications\\RecordDeletedNotification',
        'notifiable_type' => $user->getMorphClass(),
        'notifiable_id' => $user->id,
        'data' => json_encode(['title' => 'Test', 'body' => 'Body']),
        'read_at' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('notifications.index', ['notification' => $id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Notifications/Index')
            ->where('highlight_notification_id', $id));

    expect(DB::table('notifications')->where('id', $id)->value('read_at'))->not->toBeNull();
});

test('guests cannot clear all notifications', function () {
    $this->post(route('notifications.destroy-all'))->assertRedirect(route('login'));
});

test('authenticated user can clear all own notifications', function () {
    $alice = User::factory()->create();
    $bob = User::factory()->create();

    foreach ([$alice, $bob] as $u) {
        DB::table('notifications')->insert([
            'id' => (string) Str::uuid(),
            'type' => 'App\\Notifications\\RecordDeletedNotification',
            'notifiable_type' => $u->getMorphClass(),
            'notifiable_id' => $u->id,
            'data' => json_encode(['title' => 'Test', 'body' => 'Body']),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    expect(DB::table('notifications')->where('notifiable_id', $alice->id)->where('notifiable_type', $alice->getMorphClass())->count())->toBe(1);

    $this->actingAs($alice)
        ->post(route('notifications.destroy-all'))
        ->assertRedirect(route('notifications.index'));

    expect(DB::table('notifications')->where('notifiable_id', $alice->id)->where('notifiable_type', $alice->getMorphClass())->count())->toBe(0);
    expect(DB::table('notifications')->where('notifiable_id', $bob->id)->where('notifiable_type', $bob->getMorphClass())->count())->toBe(1);
});
