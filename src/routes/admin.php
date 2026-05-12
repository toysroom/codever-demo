<?php

use App\Http\Controllers\Admin\SettingsAccountsController;
use App\Http\Controllers\Admin\SettingsBackupMonitorController;
use App\Http\Controllers\Admin\SettingsInfoController;
use App\Http\Controllers\Admin\SettingsLicensePlansController;
use App\Http\Controllers\Admin\SettingsLogsController;
use App\Http\Controllers\Admin\SettingsModulesController;
use App\Http\Controllers\Admin\SettingsPermissionsController;
use App\Http\Controllers\Admin\SettingsPreferencesController;
use App\Http\Controllers\Admin\SettingsRolesController;
use App\Http\Controllers\Admin\SettingsUsersController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])
    ->prefix('admin/settings')
    ->group(function (): void {
        Route::get('/users', [SettingsUsersController::class, 'index'])
            ->middleware('permission:settings.users.index')
            ->name('users.index');
        Route::get('/users/create', [SettingsUsersController::class, 'create'])
            ->middleware('permission:settings.users.index')
            ->name('users.create');
        Route::post('/users', [SettingsUsersController::class, 'store'])
            ->middleware('permission:settings.users.index')
            ->name('users.store');
        Route::get('/users/export', [SettingsUsersController::class, 'export'])
            ->middleware('permission:settings.users.index')
            ->name('users.export');
        Route::get('/users/{user}', [SettingsUsersController::class, 'show'])
            ->middleware('permission:settings.users.index')
            ->name('users.show');
        Route::get('/users/{user}/edit', [SettingsUsersController::class, 'edit'])
            ->middleware('permission:settings.users.index')
            ->name('users.edit');
        Route::put('/users/{user}', [SettingsUsersController::class, 'update'])
            ->middleware('permission:settings.users.index')
            ->name('users.update');
        Route::delete('/users/{user}', [SettingsUsersController::class, 'destroy'])
            ->middleware('permission:settings.users.index')
            ->name('users.destroy');
        Route::post('/users/{user}/toggle-active', [SettingsUsersController::class, 'toggleActive'])
            ->middleware('permission:settings.users.index')
            ->name('users.toggle-active');

        Route::get('/accounts', [SettingsAccountsController::class, 'index'])
            ->middleware('permission:settings.accounts.index')
            ->name('accounts.index');
        Route::get('/accounts/create', [SettingsAccountsController::class, 'create'])
            ->middleware('permission:settings.accounts.index')
            ->name('accounts.create');
        Route::post('/accounts', [SettingsAccountsController::class, 'store'])
            ->middleware('permission:settings.accounts.index')
            ->name('accounts.store');
        Route::get('/accounts/{account}', [SettingsAccountsController::class, 'show'])
            ->middleware('permission:settings.accounts.index')
            ->name('accounts.show');
        Route::get('/accounts/{account}/edit', [SettingsAccountsController::class, 'edit'])
            ->middleware('permission:settings.accounts.index')
            ->name('accounts.edit');
        Route::put('/accounts/{account}', [SettingsAccountsController::class, 'update'])
            ->middleware('permission:settings.accounts.index')
            ->name('accounts.update');
        Route::delete('/accounts/{account}', [SettingsAccountsController::class, 'destroy'])
            ->middleware('permission:settings.accounts.index')
            ->name('accounts.destroy');
        Route::post('/accounts/{account}/toggle-active', [SettingsAccountsController::class, 'toggleActive'])
            ->middleware('permission:settings.accounts.index')
            ->name('accounts.toggle-active');

        Route::get('/license-plans', [SettingsLicensePlansController::class, 'index'])
            ->middleware('permission:settings.license_plans.index')
            ->name('license-plans.index');
        Route::get('/license-plans/create', [SettingsLicensePlansController::class, 'create'])
            ->middleware('permission:settings.license_plans.index')
            ->name('license-plans.create');
        Route::post('/license-plans', [SettingsLicensePlansController::class, 'store'])
            ->middleware('permission:settings.license_plans.index')
            ->name('license-plans.store');
        Route::get('/license-plans/{license_plan}', [SettingsLicensePlansController::class, 'show'])
            ->middleware('permission:settings.license_plans.index')
            ->name('license-plans.show');
        Route::get('/license-plans/{license_plan}/edit', [SettingsLicensePlansController::class, 'edit'])
            ->middleware('permission:settings.license_plans.index')
            ->name('license-plans.edit');
        Route::put('/license-plans/{license_plan}', [SettingsLicensePlansController::class, 'update'])
            ->middleware('permission:settings.license_plans.index')
            ->name('license-plans.update');
        Route::delete('/license-plans/{license_plan}', [SettingsLicensePlansController::class, 'destroy'])
            ->middleware('permission:settings.license_plans.index')
            ->name('license-plans.destroy');
        Route::post('/license-plans/{license_plan}/toggle-active', [SettingsLicensePlansController::class, 'toggleActive'])
            ->middleware('permission:settings.license_plans.index')
            ->name('license-plans.toggle-active');
        Route::post('/license-plans/{license_plan}/perpetual-codes', [SettingsLicensePlansController::class, 'storePerpetualCode'])
            ->middleware('permission:settings.license_plans.index')
            ->name('license-plans.perpetual-codes.store');
        Route::delete('/license-plans/{license_plan}/perpetual-codes/{perpetual_code}', [SettingsLicensePlansController::class, 'destroyPerpetualCode'])
            ->middleware('permission:settings.license_plans.index')
            ->name('license-plans.perpetual-codes.destroy');

        Route::get('/roles', [SettingsRolesController::class, 'index'])
            ->middleware('permission:settings.roles.index')
            ->name('roles.index');
        Route::get('/roles/create', [SettingsRolesController::class, 'create'])
            ->middleware('permission:settings.roles.index')
            ->name('roles.create');
        Route::post('/roles', [SettingsRolesController::class, 'store'])
            ->middleware('permission:settings.roles.index')
            ->name('roles.store');
        Route::get('/roles/export', [SettingsRolesController::class, 'export'])
            ->middleware('permission:settings.roles.index')
            ->name('roles.export');
        Route::get('/roles/{role}', [SettingsRolesController::class, 'show'])
            ->middleware('permission:settings.roles.index')
            ->name('roles.show');
        Route::get('/roles/{role}/edit', [SettingsRolesController::class, 'edit'])
            ->middleware('permission:settings.roles.index')
            ->name('roles.edit');
        Route::put('/roles/{role}', [SettingsRolesController::class, 'update'])
            ->middleware('permission:settings.roles.index')
            ->name('roles.update');
        Route::delete('/roles/{role}', [SettingsRolesController::class, 'destroy'])
            ->middleware('permission:settings.roles.index')
            ->name('roles.destroy');
        Route::post('/roles/{role}/toggle-active', [SettingsRolesController::class, 'toggleActive'])
            ->middleware('permission:settings.roles.index')
            ->name('roles.toggle-active');

        Route::get('/permissions', [SettingsPermissionsController::class, 'index'])
            ->middleware('permission:settings.permissions.index')
            ->name('permissions.index');

        Route::get('/preferences', [SettingsPreferencesController::class, 'index'])
            ->middleware('permission:settings.preferences.index')
            ->name('preferences.index');
        Route::put('/preferences', [SettingsPreferencesController::class, 'update'])
            ->middleware('permission:settings.preferences.index')
            ->name('preferences.update');

        Route::get('/modules', [SettingsModulesController::class, 'index'])
            ->middleware('permission:settings.modules.index')
            ->name('settings.modules.index');
        Route::put('/modules/members/{member}', [SettingsModulesController::class, 'updateMember'])
            ->middleware('permission:settings.modules.index')
            ->name('settings.modules.members.update');

        Route::get('/logs', [SettingsLogsController::class, 'index'])
            ->middleware('permission:settings.logs.index')
            ->name('logs.index');
        Route::delete('/logs', [SettingsLogsController::class, 'destroyAll'])
            ->middleware('permission:settings.logs.index')
            ->name('logs.destroy-all');

        Route::get('/info', [SettingsInfoController::class, 'index'])
            ->middleware('permission:settings.system.index')
            ->name('info.index');

        Route::get('/backup', [SettingsBackupMonitorController::class, 'index'])
            ->middleware('permission:settings.backup.index')
            ->name('backup-monitor.index');
        Route::post('/backup/run', [SettingsBackupMonitorController::class, 'run'])
            ->middleware('permission:settings.backup.index')
            ->name('backup-monitor.run');
        Route::post('/backup/clean', [SettingsBackupMonitorController::class, 'clean'])
            ->middleware('permission:settings.backup.index')
            ->name('backup-monitor.clean');
        Route::get('/backup/download', [SettingsBackupMonitorController::class, 'download'])
            ->middleware('permission:settings.backup.index')
            ->name('backup-monitor.download');
        Route::delete('/backup', [SettingsBackupMonitorController::class, 'delete'])
            ->middleware('permission:settings.backup.index')
            ->name('backup-monitor.delete');
        Route::get('/backup/logs', [SettingsBackupMonitorController::class, 'logs'])
            ->middleware('permission:settings.backup.index')
            ->name('backup-monitor.logs');
        Route::get('/backup/status', [SettingsBackupMonitorController::class, 'status'])
            ->middleware('permission:settings.backup.index')
            ->name('backup-monitor.status');
    });
