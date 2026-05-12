<?php

namespace App\Providers;

use App\Events\CustomerCrmReminderDue;
use App\Listeners\SendCustomerCrmReminder;
use App\Models\Member;
use App\Modules\Customers\Contracts\CustomerRepositoryInterface;
use App\Modules\Customers\Repositories\EloquentCustomerRepository;
use App\Modules\Products\Contracts\PriceListRepositoryInterface;
use App\Modules\Products\Contracts\ProductCategoryRepositoryInterface;
use App\Modules\Products\Contracts\ProductRepositoryInterface;
use App\Modules\Products\Repositories\EloquentPriceListRepository;
use App\Modules\Products\Repositories\EloquentProductCategoryRepository;
use App\Modules\Products\Repositories\EloquentProductRepository;
use App\Modules\Web\Contracts\WebDomainRepositoryInterface;
use App\Modules\Web\Repositories\EloquentWebDomainRepository;
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

        Health::checks([
            DatabaseCheck::new(),
            RedisCheck::new(),
        ]);
    }
}
