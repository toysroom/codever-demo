<?php

namespace App\Modules\Products\Contracts;

use App\Modules\Products\Caching\ModelCacheReadResult;
use App\Modules\Products\Caching\PaginatedCacheReadResult;

interface ProductRepositoryInterface
{
    public function paginate(int $perPage, string $sortField, string $sortOrder, ?string $search = null): PaginatedCacheReadResult;

    public function find(int $id): ModelCacheReadResult;
}
