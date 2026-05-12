<?php

namespace App\Modules\Products\Contracts;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ProductRepositoryInterface
{
    public function paginate(int $perPage, string $sortField, string $sortOrder): LengthAwarePaginator;

    public function find(int $id): ?Product;
}
