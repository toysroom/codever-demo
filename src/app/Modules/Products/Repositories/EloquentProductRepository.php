<?php

namespace App\Modules\Products\Repositories;

use App\Models\Product;
use App\Modules\Products\Contracts\ProductRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentProductRepository implements ProductRepositoryInterface
{
    public function paginate(int $perPage, string $sortField, string $sortOrder): LengthAwarePaginator
    {
        $direction = strtolower($sortOrder) === 'desc' ? 'desc' : 'asc';

        return Product::query()
            ->with([
                'category:id,name',
                'member:id,company_name,first_name,last_name',
                'prices' => fn ($q) => $q->with('priceList:id,name,currency'),
            ])
            ->orderBy($sortField, $direction)
            ->orderBy('id')
            ->paginate($perPage);
    }

    public function find(int $id): ?Product
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
