<?php

namespace App\Modules\Web\Contracts;

use App\Models\WebDomain;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface WebDomainRepositoryInterface
{
    public function paginate(int $perPage = 15, string $sortField = 'hostname', string $sortDirection = 'asc'): LengthAwarePaginator;

    public function find(int $id): ?WebDomain;
}
