<?php

use App\Models\DeletionCommunicationLog;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

test('guests are redirected from email notifications index', function () {
    $this->get(route('email-notifications.index'))->assertRedirect(route('login'));
});

test('users without email_notifications permission cannot visit email notifications index', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('email-notifications.index'))
        ->assertForbidden();
});

test('authenticated users can visit email notifications index', function () {
    $user = User::factory()->create(['user_type' => 'admin']);
    $user->assignRole('admin');

    $this->actingAs($user)
        ->get(route('email-notifications.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('EmailNotifications/Index')
            ->has('logs')
            ->has('filters'));
});

test('email notifications index lists only logs caused by the current user', function () {
    $alice = User::factory()->create(['user_type' => 'admin']);
    $alice->assignRole('admin');
    $bob = User::factory()->create(['user_type' => 'admin']);
    $bob->assignRole('admin');

    DeletionCommunicationLog::query()->create([
        'subject_type' => User::class,
        'subject_id' => $alice->id,
        'subject_label' => 'Alice record',
        'caused_by_user_id' => $alice->id,
        'recipient_email' => 'ops@example.test',
        'email_sent_at' => now(),
        'notification_sent_at' => now(),
    ]);

    DeletionCommunicationLog::query()->create([
        'subject_type' => User::class,
        'subject_id' => $bob->id,
        'subject_label' => 'Bob record',
        'caused_by_user_id' => $bob->id,
        'recipient_email' => 'ops@example.test',
        'email_sent_at' => now(),
        'notification_sent_at' => now(),
    ]);

    $this->actingAs($alice);

    $this->get(route('email-notifications.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('EmailNotifications/Index')
            ->has('logs.data', 1)
            ->where('logs.data.0.subject_label', 'Alice record'));
});

test('guests cannot clear all email notification logs', function () {
    $this->post(route('email-notifications.logs.destroy-all'))->assertRedirect(route('login'));
});

test('users without email_notifications permission cannot clear all logs', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('email-notifications.logs.destroy-all'))
        ->assertForbidden();
});

test('user can clear all own deletion communication logs', function () {
    $alice = User::factory()->create(['user_type' => 'admin']);
    $alice->assignRole('admin');
    $bob = User::factory()->create(['user_type' => 'admin']);
    $bob->assignRole('admin');

    DeletionCommunicationLog::query()->create([
        'subject_type' => User::class,
        'subject_id' => $alice->id,
        'subject_label' => 'Alice record',
        'caused_by_user_id' => $alice->id,
        'recipient_email' => 'ops@example.test',
        'email_sent_at' => now(),
        'notification_sent_at' => now(),
    ]);

    DeletionCommunicationLog::query()->create([
        'subject_type' => User::class,
        'subject_id' => $bob->id,
        'subject_label' => 'Bob record',
        'caused_by_user_id' => $bob->id,
        'recipient_email' => 'ops@example.test',
        'email_sent_at' => now(),
        'notification_sent_at' => now(),
    ]);

    expect(DeletionCommunicationLog::query()->where('caused_by_user_id', $alice->id)->count())->toBe(1);

    $this->actingAs($alice)
        ->post(route('email-notifications.logs.destroy-all'))
        ->assertRedirect(route('email-notifications.index'));

    expect(DeletionCommunicationLog::query()->where('caused_by_user_id', $alice->id)->count())->toBe(0);
    expect(DeletionCommunicationLog::query()->where('caused_by_user_id', $bob->id)->count())->toBe(1);
});
