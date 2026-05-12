<?php

namespace App\Modules\Products\Repositories;

use App\Models\Product;
use App\Modules\Products\Caching\ModelCacheReadResult;
use App\Modules\Products\Caching\PaginatedCacheReadResult;
use App\Modules\Products\Caching\ProductsCatalogCache;
use App\Modules\Products\Contracts\ProductRepositoryInterface;

class EloquentProductRepository implements ProductRepositoryInterface
{
    public function __construct(
        protected ProductsCatalogCache $catalogCache
    ) {}

    public function paginate(int $perPage, string $sortField, string $sortOrder, ?string $search = null): PaginatedCacheReadResult
    {
        $searchKey = $search !== null && $search !== '' ? $search : '';

        return $this->catalogCache->rememberPaginated(
            ProductsCatalogCache::ENTITY_PRODUCTS,
            $perPage,
            $sortField,
            $sortOrder,
            $searchKey,
            fn (): \Illuminate\Contracts\Pagination\LengthAwarePaginator => $this->queryPaginate($perPage, $sortField, $sortOrder, $search),
        );
    }

    public function find(int $id): ModelCacheReadResult
    {
        return $this->catalogCache->rememberShow(
            ProductsCatalogCache::ENTITY_PRODUCTS,
            $id,
            fn (): ?Product => $this->queryFind($id),
        );
    }

    protected function queryPaginate(int $perPage, string $sortField, string $sortOrder, ?string $search = null): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $direction = strtolower($sortOrder) === 'desc' ? 'desc' : 'asc';

        $term = $search !== null ? trim($search) : '';

        return Product::query()
            ->with([
                'category:id,name',
                'member:id,company_name,first_name,last_name',
                'prices' => fn ($q) => $q->with('priceList:id,name,currency'),
            ])
            ->when($term !== '', function ($query) use ($term): void {
                $query->where(function ($q) use ($term): void {
                    $q->where('code', 'like', '%'.$term.'%')
                        ->orWhere('name', 'like', '%'.$term.'%');
                });
            })
            ->orderBy($sortField, $direction)
            ->orderBy('id')
            ->paginate($perPage);
    }

    protected function queryFind(int $id): ?Product
    {
        return Product::query()
            ->with([
                'category:id,name',
                'member:id,company_name,first_name,last_name',
                'prices.priceList:id,name,currency',
            ])
            ->find($id);
    }
}
