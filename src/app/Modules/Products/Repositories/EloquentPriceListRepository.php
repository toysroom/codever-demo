<?php

namespace App\Modules\Products\Repositories;

use App\Models\PriceList;
use App\Modules\Products\Caching\ModelCacheReadResult;
use App\Modules\Products\Caching\PaginatedCacheReadResult;
use App\Modules\Products\Caching\ProductsCatalogCache;
use App\Modules\Products\Contracts\PriceListRepositoryInterface;

class EloquentPriceListRepository implements PriceListRepositoryInterface
{
    public function __construct(
        protected ProductsCatalogCache $catalogCache
    ) {}

    public function paginate(int $perPage, string $sortField, string $sortOrder): PaginatedCacheReadResult
    {
        return $this->catalogCache->rememberPaginated(
            ProductsCatalogCache::ENTITY_PRICE_LISTS,
            $perPage,
            $sortField,
            $sortOrder,
            '',
            fn (): \Illuminate\Contracts\Pagination\LengthAwarePaginator => $this->queryPaginate($perPage, $sortField, $sortOrder),
        );
    }

    public function find(int $id): ModelCacheReadResult
    {
        return $this->catalogCache->rememberShow(
            ProductsCatalogCache::ENTITY_PRICE_LISTS,
            $id,
            fn (): ?PriceList => $this->queryFind($id),
        );
    }

    protected function queryPaginate(int $perPage, string $sortField, string $sortOrder): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $direction = strtolower($sortOrder) === 'desc' ? 'desc' : 'asc';

        return PriceList::query()
            ->with(['member:id,company_name,first_name,last_name'])
            ->orderBy($sortField, $direction)
            ->orderBy('id')
            ->paginate($perPage);
    }

    protected function queryFind(int $id): ?PriceList
    {
        return PriceList::query()
            ->with(['member:id,company_name,first_name,last_name'])
            ->find($id);
    }
}
