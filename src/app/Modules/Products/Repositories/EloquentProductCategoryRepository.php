<?php

namespace App\Modules\Products\Repositories;

use App\Models\ProductCategory;
use App\Modules\Products\Contracts\ProductCategoryRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentProductCategoryRepository implements ProductCategoryRepositoryInterface
{
    public function paginate(int $perPage, string $sortField, string $sortOrder): LengthAwarePaginator
    {
        $direction = strtolower($sortOrder) === 'desc' ? 'desc' : 'asc';

        return ProductCategory::query()
            ->with(['parent:id,name', 'member:id,company_name,first_name,last_name'])
            ->orderBy($sortField, $direction)
            ->orderBy('id')
            ->paginate($perPage);
    }

    public function find(int $id): ?ProductCategory
    {
        return ProductCategory::query()
            ->with(['parent:id,name', 'member:id,company_name,first_name,last_name'])
            ->find($id);
    }
}
