<?php

use App\Http\Controllers\EmailNotificationsController;
use App\Http\Controllers\NotificationController;
use App\Models\Company;
use App\Models\Customer;
use App\Models\CustomerCrmNote;
use App\Models\Member;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Spatie\Health\Http\Controllers\HealthCheckJsonResultsController;
use Spatie\Health\Http\Middleware\RequiresSecretToken;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

Route::get('/health/spatie', HealthCheckJsonResultsController::class)
    ->middleware(RequiresSecretToken::class)
    ->name('health.spatie');

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
})->name('home');

// Route per cambio lingua
Route::post('/locale', function (\Illuminate\Http\Request $request) {
    $request->validate([
        'locale' => 'required|in:it,en',
    ]);

    app()->setLocale($request->locale);
    session()->put('locale', $request->locale);

    return redirect()->back();
})->name('locale.update');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $user = request()->user();
        $isAdmin = $user?->isAdmin() ?? false;

        $pendingReminders = CustomerCrmNote::query()
            ->whereNotNull('reminder_at')
            ->whereNull('reminder_notified_at')
            ->where('reminder_at', '<=', now())
            ->count();

        $emptyOrNull = fn (string $column) => fn ($q) => $q->whereNull($column)->orWhere($column, '');

        return Inertia::render('dashboard', [
            'stats' => [
                'users_total' => $isAdmin ? User::query()->count() : null,
                'users_active' => $isAdmin ? User::query()->where('is_active', true)->count() : null,
                'roles_total' => $isAdmin ? Role::query()->count() : null,
                'permissions_total' => $isAdmin ? Permission::query()->count() : null,
                'customers_total' => Customer::query()->count(),
                'accounts_total' => $isAdmin ? Member::query()->owners()->count() : null,
                'crm_pending_reminders' => $pendingReminders,
                'customers_missing_vat' => Customer::query()->where($emptyOrNull('vat_number'))->count(),
                'customers_missing_email' => Customer::query()->where($emptyOrNull('contact_email'))->count(),
                'companies_missing_vat' => Company::query()->where($emptyOrNull('vat_number'))->count(),
                'products_missing_category' => Product::query()->whereNull('product_category_id')->count(),
            ],
        ]);
    })->name('dashboard');

    Route::get('email-notifications', [EmailNotificationsController::class, 'index'])
        ->middleware('permission:email_notifications.index')
        ->name('email-notifications.index');
    Route::post('email-notifications/logs/destroy-all', [EmailNotificationsController::class, 'destroyAllLogs'])
        ->middleware('permission:email_notifications.index')
        ->name('email-notifications.logs.destroy-all');

    Route::get('email-notifications/inbox', [NotificationController::class, 'index'])
        ->name('notifications.index');

    Route::post('email-notifications/inbox/{notification}/read', [NotificationController::class, 'markRead'])
        ->name('notifications.read');
    Route::post('email-notifications/inbox/read-all', [NotificationController::class, 'markAllRead'])
        ->name('notifications.read-all');
    Route::post('email-notifications/inbox/destroy-all', [NotificationController::class, 'destroyAll'])
        ->name('notifications.destroy-all');

    Route::get('notifications', function (\Illuminate\Http\Request $request) {
        return redirect()->route('notifications.index', $request->query());
    });

    Route::post('notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);
});

require __DIR__.'/settings.php';
