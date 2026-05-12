<?php

use App\Jobs\SendRecordDeletedMailJob;
use App\Mail\RecordDeletedMail;
use App\Models\DeletionCommunicationLog;
use App\Models\LicensePlan;
use App\Models\Product;
use App\Models\User;
use App\Notifications\RecordDeletedNotification;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

test('soft deleting a license plan sends mail and database notification and logs communication', function () {
    Mail::fake();
    Notification::fake();

    $user = User::factory()->create([
        'user_type' => 'admin',
    ]);
    $user->assignRole('admin');

    $plan = LicensePlan::query()->create([
        'name' => 'Plan To Delete',
        'slug' => 'plan-del-'.uniqid(),
        'package_tier' => null,
        'annual_term_months' => 12,
        'trial_days' => 0,
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->delete(route('license-plans.destroy', $plan));

    $response->assertRedirect(route('license-plans.index'));

    expect(DeletionCommunicationLog::query()->count())->toBe(1);

    $log = DeletionCommunicationLog::query()->first();
    expect($log->recipient_email)->toBe($user->email)
        ->and($log->email_sent_at)->not->toBeNull();

    Mail::assertSentTimes(RecordDeletedMail::class, 1);
    Notification::assertSentToTimes($user, RecordDeletedNotification::class, 1);
});

test('soft deleting a product sends mail and database notification and logs communication', function () {
    Mail::fake();
    Notification::fake();

    $user = User::factory()->create([
        'user_type' => 'admin',
    ]);
    $user->assignRole('admin');

    $product = Product::factory()->create();

    $response = $this->actingAs($user)->delete(route('modules.products.prodotti.destroy', $product));

    $response->assertRedirect(route('modules.products.prodotti.index'));

    expect(DeletionCommunicationLog::query()->count())->toBe(1);

    $log = DeletionCommunicationLog::query()->first();
    expect($log->recipient_email)->toBe($user->email)
        ->and($log->email_sent_at)->not->toBeNull();

    Mail::assertSentTimes(RecordDeletedMail::class, 1);
    Notification::assertSentToTimes($user, RecordDeletedNotification::class, 1);
});

test('send record deleted mail job delivers mail for product when queue worker has no authenticated user', function () {
    Mail::fake();

    $admin = User::factory()->create([
        'user_type' => 'admin',
    ]);
    $admin->assignRole('admin');

    $this->actingAs($admin);
    $product = Product::factory()->create();
    $product->delete();

    $log = DeletionCommunicationLog::query()->create([
        'subject_type' => $product->getMorphClass(),
        'subject_id' => $product->getKey(),
        'subject_label' => (string) $product->name,
        'caused_by_user_id' => $admin->id,
    ]);

    Auth::logout();

    $job = new SendRecordDeletedMailJob($log->id, (string) $admin->email, Product::class, (string) $product->getKey());
    app()->call([$job, 'handle']);

    Mail::assertSent(RecordDeletedMail::class);
});
