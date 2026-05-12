<?php

namespace App\Modules\Products\Contracts;

use App\Models\ProductCategory;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ProductCategoryRepositoryInterface
{
    public function paginate(int $perPage, string $sortField, string $sortOrder): LengthAwarePaginator;

    public function find(int $id): ?ProductCategory;
}
