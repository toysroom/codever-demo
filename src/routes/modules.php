<?php

use App\Modules\Customers\Http\Controllers\CompanyController;
use App\Modules\Customers\Http\Controllers\CustomerController;
use App\Modules\Customers\Http\Controllers\CustomerTypeController;
use App\Modules\Products\Http\Controllers\PriceListController;
use App\Modules\Products\Http\Controllers\ProductCategoryController;
use App\Modules\Products\Http\Controllers\ProductController;
use App\Modules\Web\Http\Controllers\WebDomainController;
use App\Modules\Web\Http\Controllers\WebHostingProviderController;
use App\Modules\Web\Http\Controllers\WebServerController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'account.scope', 'module:customers'])
    ->prefix('modules/customers')
    ->name('modules.customers.')
    ->group(function (): void {
        Route::resource('customer-types', CustomerTypeController::class);
        Route::post('customer-types/{customer_type}/toggle-active', [CustomerTypeController::class, 'toggleActive'])->name(
            'customer-types.toggle-active',
        );

        Route::get('/', [CustomerController::class, 'index'])->name('index');
        Route::get('/create', [CustomerController::class, 'create'])->name('create');
        Route::post('/', [CustomerController::class, 'store'])->name('store');
        Route::get('/{customer}', [CustomerController::class, 'show'])->name('show');
        Route::get('/{customer}/edit', [CustomerController::class, 'edit'])->name('edit');
        Route::put('/{customer}', [CustomerController::class, 'update'])->name('update');
        Route::patch('/{customer}', [CustomerController::class, 'update'])->name('patch');
        Route::delete('/{customer}', [CustomerController::class, 'destroy'])->name('destroy');
        Route::post('/{customer}/toggle-active', [CustomerController::class, 'toggleActive'])->name('toggle-active');
    });

Route::middleware(['auth', 'verified', 'account.scope', 'module:customers'])
    ->prefix('modules/companies')
    ->name('modules.companies.')
    ->group(function (): void {
        Route::get('/', [CompanyController::class, 'index'])->name('index');
        Route::get('/create', [CompanyController::class, 'create'])->name('create');
        Route::post('/', [CompanyController::class, 'store'])->name('store');
        Route::get('/{company}', [CompanyController::class, 'show'])->name('show');
        Route::get('/{company}/edit', [CompanyController::class, 'edit'])->name('edit');
        Route::put('/{company}', [CompanyController::class, 'update'])->name('update');
        Route::patch('/{company}', [CompanyController::class, 'update'])->name('patch');
        Route::delete('/{company}', [CompanyController::class, 'destroy'])->name('destroy');
    });

Route::middleware(['auth', 'verified', 'account.scope', 'module:products'])
    ->prefix('modules/products')
    ->name('modules.products.')
    ->group(function (): void {
        Route::resource('listini', PriceListController::class)
            ->parameters(['listini' => 'price_list']);
        Route::post('listini/{price_list}/toggle-active', [PriceListController::class, 'toggleActive'])->name('listini.toggle-active');
    });

Route::middleware(['auth', 'verified', 'account.scope', 'module:products'])
    ->prefix('modules/products')
    ->name('modules.products.')
    ->group(function (): void {
        Route::resource('categorie', ProductCategoryController::class)
            ->parameters(['categorie' => 'product_category']);
        Route::post('categorie/{product_category}/toggle-active', [ProductCategoryController::class, 'toggleActive'])->name(
            'categorie.toggle-active',
        );
    });

Route::middleware(['auth', 'verified', 'account.scope', 'module:products'])
    ->prefix('modules/products')
    ->name('modules.products.')
    ->group(function (): void {
        Route::get('prodotti/{product}/change-history', [ProductController::class, 'changeHistory'])->name(
            'prodotti.change-history',
        );
        Route::resource('prodotti', ProductController::class)
            ->parameters(['prodotti' => 'product']);
        Route::post('prodotti/{product}/toggle-active', [ProductController::class, 'toggleActive'])->name('prodotti.toggle-active');
    });

Route::middleware(['auth', 'verified', 'account.scope', 'module:web'])
    ->prefix('modules/web')
    ->name('modules.web.')
    ->group(function (): void {
        Route::post('domini/{web_domain}/ftp-upload-connector-test', [WebDomainController::class, 'ftpUploadConnectorTest'])->name('domini.ftp-upload-connector-test');
        Route::post('domini/{web_domain}/ftp-roundtrip-txt-test', [WebDomainController::class, 'ftpRoundtripTxtTest'])->name('domini.ftp-roundtrip-txt-test');
        Route::post('domini/{web_domain}/wp-connector/deploy', [WebDomainController::class, 'wpConnectorDeploy'])->name('domini.wp-connector.deploy');
        Route::post('domini/{web_domain}/wp-connector/site-info', [WebDomainController::class, 'wpConnectorSiteInfo'])->name('domini.wp-connector.site-info');
        Route::post('domini/{web_domain}/wp-connector/plugin-check', [WebDomainController::class, 'wpConnectorPluginCheck'])->name('domini.wp-connector.plugin-check');
        Route::post('domini/{web_domain}/wp-connector/version-audit', [WebDomainController::class, 'wpConnectorVersionAudit'])->name('domini.wp-connector.version-audit');
        Route::post('domini/{web_domain}/detect', [WebDomainController::class, 'detect'])->name('domini.detect');
        Route::resource('domini', WebDomainController::class)->parameters([
            'domini' => 'web_domain',
        ]);
        Route::resource('hosting-providers', WebHostingProviderController::class)
            ->parameters(['hosting-providers' => 'web_hosting_provider']);
        Route::resource('servers', WebServerController::class)
            ->parameters(['servers' => 'web_server']);
    });
