<?php

namespace App\Modules\Products\Contracts;

use App\Models\PriceList;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface PriceListRepositoryInterface
{
    public function paginate(int $perPage, string $sortField, string $sortOrder): LengthAwarePaginator;

    public function find(int $id): ?PriceList;
}
