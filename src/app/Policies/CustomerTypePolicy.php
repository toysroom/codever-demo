<?php

namespace App\Policies;

use App\Models\CustomerType;
use App\Models\User;
use App\Services\ModuleEntitlementService;

class CustomerTypePolicy
{
    public function __construct(
        protected ModuleEntitlementService $modules
    ) {}

    public function viewAny(User $user): bool
    {
        return $this->hasCustomersModule($user) && $user->canAccess('customer_types', 'index');
    }

    public function view(User $user, CustomerType $customerType): bool
    {
        return $this->hasCustomersModule($user) && $user->canAccess('customer_types', 'show');
    }

    public function create(User $user): bool
    {
        return $this->hasCustomersModule($user) && $user->canAccess('customer_types', 'create');
    }

    public function update(User $user, CustomerType $customerType): bool
    {
        return $this->hasCustomersModule($user) && $user->canAccess('customer_types', 'update');
    }

    public function delete(User $user, CustomerType $customerType): bool
    {
        return $this->hasCustomersModule($user) && $user->canAccess('customer_types', 'delete');
    }

    protected function hasCustomersModule(User $user): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $this->modules->memberHasModule($user->getOwnerMember(), 'customers');
    }
}
