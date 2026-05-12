<?php

namespace App\Modules\Customers\Contracts;

use App\Models\Customer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CustomerRepositoryInterface
{
    public function paginateWithMember(int $perPage = 15, string $sortField = 'last_name', string $sortDirection = 'asc'): LengthAwarePaginator;

    public function find(int $id): ?Customer;

    public function countForMember(int $memberOwnerId): int;
}
