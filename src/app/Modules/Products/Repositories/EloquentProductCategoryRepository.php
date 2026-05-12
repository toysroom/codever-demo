<?php

namespace App\Modules\Products\Repositories;

use App\Models\ProductCategory;
use App\Modules\Products\Caching\ModelCacheReadResult;
use App\Modules\Products\Caching\PaginatedCacheReadResult;
use App\Modules\Products\Caching\ProductsCatalogCache;
use App\Modules\Products\Contracts\ProductCategoryRepositoryInterface;

class EloquentProductCategoryRepository implements ProductCategoryRepositoryInterface
{
    public function __construct(
        protected ProductsCatalogCache $catalogCache
    ) {}

    public function paginate(int $perPage, string $sortField, string $sortOrder): PaginatedCacheReadResult
    {
        return $this->catalogCache->rememberPaginated(
            ProductsCatalogCache::ENTITY_CATEGORIES,
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
            ProductsCatalogCache::ENTITY_CATEGORIES,
            $id,
            fn (): ?ProductCategory => $this->queryFind($id),
        );
    }

    protected function queryPaginate(int $perPage, string $sortField, string $sortOrder): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $direction = strtolower($sortOrder) === 'desc' ? 'desc' : 'asc';

        return ProductCategory::query()
            ->with(['parent:id,name', 'member:id,company_name,first_name,last_name'])
            ->orderBy($sortField, $direction)
            ->orderBy('id')
            ->paginate($perPage);
    }

    protected function queryFind(int $id): ?ProductCategory
    {
        return ProductCategory::query()
            ->with(['parent:id,name', 'member:id,company_name,first_name,last_name'])
            ->find($id);
    }
}
