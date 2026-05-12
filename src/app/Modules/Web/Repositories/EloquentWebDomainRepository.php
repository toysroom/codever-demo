<?php

namespace App\Modules\Web\Repositories;

use App\Models\WebDomain;
use App\Modules\Web\Contracts\WebDomainRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentWebDomainRepository implements WebDomainRepositoryInterface
{
    public function paginate(int $perPage = 15, string $sortField = 'hostname', string $sortDirection = 'asc'): LengthAwarePaginator
    {
        $whitelist = ['hostname', 'id', 'created_at', 'updated_at', 'stack'];

        $field = in_array($sortField, $whitelist, true) ? $sortField : 'hostname';

        $dir = strtolower($sortDirection) === 'desc' ? 'desc' : 'asc';

        return WebDomain::query()
            ->with([
                'member:id,company_name,first_name,last_name',
                'customer:id,company_name,first_name,last_name,member_id',
                'company:id,name,member_id',
                'ftpAccounts.latestFtpConnectionTestLog',
                'emails',
                'databaseConnections',
            ])
            ->orderBy($field, $dir)
            ->orderBy('id')
            ->paginate($perPage);
    }

    public function find(int $id): ?WebDomain
    {
        return WebDomain::query()
            ->with([
                'member:id,company_name,first_name,last_name',
                'customer:id,company_name,first_name,last_name,member_id',
                'company:id,name,member_id',
                'ftpAccounts.latestFtpConnectionTestLog',
                'emails',
                'databaseConnections',
            ])
            ->find($id);
    }
}
