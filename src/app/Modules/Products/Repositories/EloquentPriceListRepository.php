<?php

namespace App\Modules\Products\Repositories;

use App\Models\PriceList;
use App\Modules\Products\Contracts\PriceListRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentPriceListRepository implements PriceListRepositoryInterface
{
    public function paginate(int $perPage, string $sortField, string $sortOrder): LengthAwarePaginator
    {
        $direction = strtolower($sortOrder) === 'desc' ? 'desc' : 'asc';

        return PriceList::query()
            ->with(['member:id,company_name,first_name,last_name'])
            ->orderBy($sortField, $direction)
            ->orderBy('id')
            ->paginate($perPage);
    }

    public function find(int $id): ?PriceList
    {
        return PriceList::query()
            ->with(['member:id,company_name,first_name,last_name'])
            ->find($id);
    }
}
