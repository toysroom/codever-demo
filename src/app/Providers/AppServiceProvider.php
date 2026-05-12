<?php

namespace App\Providers;

use App\Events\CustomerCrmReminderDue;
use App\Events\RecordSoftDeleted;
use App\Listeners\HandleRecordSoftDeleted;
use App\Listeners\SendCustomerCrmReminder;
use App\Models\Member;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductPrice;
use App\Models\User;
use App\Modules\Customers\Contracts\CustomerRepositoryInterface;
use App\Modules\Customers\Repositories\EloquentCustomerRepository;
use App\Modules\Products\Caching\ProductsCatalogCache;
use App\Modules\Products\Caching\ProductsCatalogCacheInvalidator;
use App\Modules\Products\Contracts\PriceListRepositoryInterface;
use App\Modules\Products\Contracts\ProductCategoryRepositoryInterface;
use App\Modules\Products\Contracts\ProductRepositoryInterface;
use App\Modules\Products\Repositories\EloquentPriceListRepository;
use App\Modules\Products\Repositories\EloquentProductCategoryRepository;
use App\Modules\Products\Repositories\EloquentProductRepository;
use App\Modules\Web\Contracts\WebDomainRepositoryInterface;
use App\Modules\Web\Repositories\EloquentWebDomainRepository;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Spatie\Health\Checks\Checks\DatabaseCheck;
use Spatie\Health\Checks\Checks\RedisCheck;
use Spatie\Health\Facades\Health;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(ProductsCatalogCache::class);
        $this->app->singleton(ProductsCatalogCacheInvalidator::class);

        $this->app->singleton(CustomerRepositoryInterface::class, EloquentCustomerRepository::class);
        $this->app->singleton(PriceListRepositoryInterface::class, EloquentPriceListRepository::class);
        $this->app->singleton(ProductCategoryRepositoryInterface::class, EloquentProductCategoryRepository::class);
        $this->app->singleton(ProductRepositoryInterface::class, EloquentProductRepository::class);
        $this->app->singleton(WebDomainRepositoryInterface::class, EloquentWebDomainRepository::class);

        // Register Telescope only in local environment
        if ($this->app->environment('local') && class_exists(\Laravel\Telescope\TelescopeServiceProvider::class)) {
            // Register the base Telescope service provider first
            $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
            // Then register our custom Telescope service provider
            $this->app->register(\App\Providers\TelescopeServiceProvider::class);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Member::class, \App\Policies\MemberPolicy::class);

        Route::bind('account', function (string $value): Member {
            $member = Member::query()->find($value);
            abort_if(! $member || ! $member->isOwner(), 404);

            return $member;
        });

        Event::listen(CustomerCrmReminderDue::class, SendCustomerCrmReminder::class);

        $this->registerProductsCatalogCacheListeners();

        /*
         * Model::deleted() sulla classe base registra solo `eloquent.deleted: Illuminate\Database\Eloquent\Model`,
         * che non corrisponde mai agli eventi emessi dai modelli concreti. Usiamo un listener wildcard.
         */
        Event::listen('eloquent.deleted: *', function (string $event, array $payload): void {
            $model = $payload[0] ?? null;
            if (! $model instanceof Model) {
                return;
            }
            if (! in_array(SoftDeletes::class, class_uses_recursive($model), true)) {
                return;
            }
            if (! method_exists($model, 'isForceDeleting') || $model->isForceDeleting()) {
                return;
            }
            $actor = auth()->user() ?? request()?->user();
            $causer = $actor instanceof User ? $actor : null;
            // Chiamata diretta: evita doppia esecuzione se il listener fosse anche auto-registrato
            // (stesso handle() tipizzato su RecordSoftDeleted + Event::listen esplicito).
            $this->app->make(HandleRecordSoftDeleted::class)->handle(new RecordSoftDeleted($model, $causer));
        });

        Health::checks([
            DatabaseCheck::new(),
            RedisCheck::new(),
        ]);
    }

    protected function registerProductsCatalogCacheListeners(): void
    {
        $invalidator = $this->app->make(ProductsCatalogCacheInvalidator::class);

        Product::saved(static function (Product $model) use ($invalidator): void {
            $invalidator->afterProductSavedOrDeleted($model);
        });
        Product::deleted(static function (Product $model) use ($invalidator): void {
            $invalidator->afterProductSavedOrDeleted($model);
        });
        Product::restored(static function (Product $model) use ($invalidator): void {
            $invalidator->afterProductSavedOrDeleted($model);
        });
        Product::forceDeleted(static function (Product $model) use ($invalidator): void {
            $invalidator->afterProductSavedOrDeleted($model);
        });

        ProductCategory::saved(static function (ProductCategory $model) use ($invalidator): void {
            $invalidator->afterProductCategorySavedOrDeleted($model);
        });
        ProductCategory::deleted(static function (ProductCategory $model) use ($invalidator): void {
            $invalidator->afterProductCategorySavedOrDeleted($model);
        });
        ProductCategory::restored(static function (ProductCategory $model) use ($invalidator): void {
            $invalidator->afterProductCategorySavedOrDeleted($model);
        });
        ProductCategory::forceDeleted(static function (ProductCategory $model) use ($invalidator): void {
            $invalidator->afterProductCategorySavedOrDeleted($model);
        });

        PriceList::saved(static function (PriceList $model) use ($invalidator): void {
            $invalidator->afterPriceListSavedOrDeleted($model);
        });
        PriceList::deleted(static function (PriceList $model) use ($invalidator): void {
            $invalidator->afterPriceListSavedOrDeleted($model);
        });
        PriceList::restored(static function (PriceList $model) use ($invalidator): void {
            $invalidator->afterPriceListSavedOrDeleted($model);
        });
        PriceList::forceDeleted(static function (PriceList $model) use ($invalidator): void {
            $invalidator->afterPriceListSavedOrDeleted($model);
        });

        ProductPrice::saved(static function (ProductPrice $model) use ($invalidator): void {
            $invalidator->afterProductPriceSavedOrDeleted($model);
        });
        ProductPrice::deleted(static function (ProductPrice $model) use ($invalidator): void {
            $invalidator->afterProductPriceSavedOrDeleted($model);
        });
        ProductPrice::restored(static function (ProductPrice $model) use ($invalidator): void {
            $invalidator->afterProductPriceSavedOrDeleted($model);
        });
        ProductPrice::forceDeleted(static function (ProductPrice $model) use ($invalidator): void {
            $invalidator->afterProductPriceSavedOrDeleted($model);
        });
    }
}
