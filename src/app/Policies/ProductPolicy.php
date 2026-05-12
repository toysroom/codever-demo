<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;
use App\Services\ModuleEntitlementService;

class ProductPolicy
{
    public function __construct(
        protected ModuleEntitlementService $modules
    ) {}

    public function viewAny(User $user): bool
    {
        return $this->hasModule($user) && $user->canAccess('products', 'index');
    }

    public function view(User $user, Product $product): bool
    {
        return $this->hasModule($user) && $user->canAccess('products', 'show');
    }

    public function create(User $user): bool
    {
        return $this->hasModule($user) && $user->canAccess('products', 'create');
    }

    public function update(User $user, Product $product): bool
    {
        return $this->hasModule($user) && $user->canAccess('products', 'update');
    }

    public function delete(User $user, Product $product): bool
    {
        return $this->hasModule($user) && $user->canAccess('products', 'delete');
    }

    protected function hasModule(User $user): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $this->modules->memberHasModule($user->getOwnerMember(), 'products');
    }
}
