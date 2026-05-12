<?php

namespace App\Modules\Products\Caching;

use App\Models\User;
use Closure;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

final class ProductsCatalogCache
{
    public const ENTITY_PRODUCTS = 'products';

    public const ENTITY_CATEGORIES = 'product_categories';

    public const ENTITY_PRICE_LISTS = 'price_lists';

    public function store(): Repository
    {
        $name = (string) config('zelante.products.cache_store', 'products');

        try {
            return Cache::store($name);
        } catch (\Throwable) {
            return Cache::store(config('cache.default'));
        }
    }

    public function listScopeKey(): string
    {
        $user = Auth::user();
        if (! $user instanceof User) {
            return 'guest';
        }
        if ($user->isAdmin()) {
            return 'admin';
        }
        $owner = $user->getOwnerMember();

        return 'member:'.($owner?->id ?? 'none');
    }

    /**
     * Liste: chiave include "generazione" (bump) così le invalidazioni non devono enumerare le pagine.
     *
     * @param  string  $listSearchQuery  Normalizzato; incluso nell'hash della pagina (liste filtrate).
     * @param  Closure(): LengthAwarePaginator  $fetch
     */
    public function rememberPaginated(
        string $entity,
        int $perPage,
        string $sortField,
        string $sortOrder,
        string $listSearchQuery,
        Closure $fetch,
    ): PaginatedCacheReadResult {
        $scope = $this->listScopeKey();
        $store = $this->store();
        $genKey = $this->listGenerationKey($entity, $scope);
        $generation = max(1, (int) $store->get($genKey) ?: 1);
        $hash = hash('sha256', implode('|', [$perPage, $sortField, $sortOrder, $listSearchQuery]));
        $pageKey = $this->listPageKey($entity, $scope, $generation, $hash);

        $cached = $store->get($pageKey);
        if ($cached instanceof LengthAwarePaginator) {
            return new PaginatedCacheReadResult($cached, 'redis');
        }

        $paginator = $fetch();
        $ttl = (int) config('zelante.products.list_ttl_seconds', 3600);
        $store->put($pageKey, $paginator, $ttl);
        if (! $store->has($genKey)) {
            $store->put($genKey, 1, now()->addYears(5));
        }

        return new PaginatedCacheReadResult($paginator, 'database');
    }

    /**
     * Dettaglio singolo: cache classica con TTL.
     *
     * @param  Closure(): mixed  $fetch
     */
    public function rememberShow(string $entity, int $id, Closure $fetch): ModelCacheReadResult
    {
        $store = $this->store();
        $key = $this->showKey($entity, $id);

        $cached = $store->get($key);
        if ($cached !== null) {
            return new ModelCacheReadResult($cached, 'redis');
        }

        $model = $fetch();
        if ($model === null) {
            return new ModelCacheReadResult(null, 'database');
        }

        $ttl = (int) config('zelante.products.show_ttl_seconds', 600);
        $store->put($key, $model, $ttl);

        return new ModelCacheReadResult($model, 'database');
    }

    public function forgetShow(string $entity, int $id): void
    {
        $this->store()->forget($this->showKey($entity, $id));
    }

    /**
     * @param  list<string>  $scopes
     */
    public function bumpListGenerations(string $entity, array $scopes): void
    {
        $store = $this->store();
        foreach (array_unique($scopes) as $scope) {
            $genKey = $this->listGenerationKey($entity, (string) $scope);
            $current = max(1, (int) $store->get($genKey) ?: 1);
            $store->put($genKey, $current + 1, now()->addYears(5));
        }
    }

    /**
     * @return list<string>
     */
    public static function scopesForMember(int $memberId): array
    {
        return ['admin', 'member:'.$memberId];
    }

    private function listGenerationKey(string $entity, string $scope): string
    {
        return 'pcl:'.$entity.':list:gen:'.$scope;
    }

    private function listPageKey(string $entity, string $scope, int $generation, string $hash): string
    {
        return 'pcl:'.$entity.':list:page:'.$scope.':g'.$generation.':'.$hash;
    }

    private function showKey(string $entity, int $id): string
    {
        return 'pcl:'.$entity.':show:'.$id;
    }
}
