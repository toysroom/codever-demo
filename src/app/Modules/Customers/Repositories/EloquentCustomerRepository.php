<?php

namespace App\Modules\Customers\Repositories;

use App\Models\Customer;
use App\Modules\Customers\Contracts\CustomerRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentCustomerRepository implements CustomerRepositoryInterface
{
    public function paginateWithMember(int $perPage = 15, string $sortField = 'last_name', string $sortDirection = 'asc'): LengthAwarePaginator
    {
        $allowed = ['last_name', 'first_name', 'company_name', 'vat_number', 'phone', 'entity_type', 'external_code', 'id', 'created_at', 'updated_at'];
        $dir = strtolower($sortDirection) === 'desc' ? 'desc' : 'asc';

        $query = Customer::query()
            ->with(['member:id,company_name,first_name,last_name'])
            ->with(['user:id,name,email']);

        if (! in_array($sortField, $allowed, true)) {
            return $query
                ->orderByRaw("LOWER(TRIM(COALESCE(company_name, ''))) ASC")
                ->orderByRaw("LOWER(TRIM(COALESCE(last_name, ''))) ASC")
                ->orderByRaw("LOWER(TRIM(COALESCE(first_name, ''))) ASC")
                ->orderBy('id')
                ->paginate($perPage);
        }

        return $query
            ->orderBy($sortField, $dir)
            ->orderBy('id')
            ->paginate($perPage);
    }

    public function find(int $id): ?Customer
    {
        return Customer::query()
            ->with(['member:id,company_name', 'user:id,name,email'])
            ->find($id);
    }

    public function countForMember(int $memberOwnerId): int
    {
        return Customer::withoutGlobalScopes()
            ->where('member_id', $memberOwnerId)
            ->count();
    }
}
