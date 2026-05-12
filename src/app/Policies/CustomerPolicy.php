<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;
use App\Services\ModuleEntitlementService;

class CustomerPolicy
{
    public function __construct(
        protected ModuleEntitlementService $modules
    ) {}

    public function viewAny(User $user): bool
    {
        return $this->hasCustomersModule($user) && $user->canAccess('customers', 'index');
    }

    public function view(User $user, Customer $customer): bool
    {
        return $this->hasCustomersModule($user) && $user->canAccess('customers', 'show');
    }

    public function create(User $user): bool
    {
        return $this->hasCustomersModule($user) && $user->canAccess('customers', 'create');
    }

    public function update(User $user, Customer $customer): bool
    {
        return $this->hasCustomersModule($user) && $user->canAccess('customers', 'update');
    }

    public function delete(User $user, Customer $customer): bool
    {
        return $this->hasCustomersModule($user) && $user->canAccess('customers', 'delete');
    }

    protected function hasCustomersModule(User $user): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $this->modules->memberHasModule($user->getOwnerMember(), 'customers');
    }
}
