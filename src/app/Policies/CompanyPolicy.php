<?php

namespace App\Policies;

use App\Models\Company;
use App\Models\User;
use App\Services\ModuleEntitlementService;

class CompanyPolicy
{
    public function __construct(
        protected ModuleEntitlementService $modules
    ) {}

    public function viewAny(User $user): bool
    {
        return $this->hasCustomersModule($user) && $user->canAccess('companies', 'index');
    }

    public function view(User $user, Company $company): bool
    {
        return $this->hasCustomersModule($user) && $user->canAccess('companies', 'show');
    }

    public function create(User $user): bool
    {
        return $this->hasCustomersModule($user) && $user->canAccess('companies', 'create');
    }

    public function update(User $user, Company $company): bool
    {
        return $this->hasCustomersModule($user) && $user->canAccess('companies', 'update');
    }

    public function delete(User $user, Company $company): bool
    {
        return $this->hasCustomersModule($user) && $user->canAccess('companies', 'delete');
    }

    protected function hasCustomersModule(User $user): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $this->modules->memberHasModule($user->getOwnerMember(), 'customers');
    }
}
