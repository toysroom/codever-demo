<?php

namespace App\Policies;

use App\Models\ProductCategory;
use App\Models\User;
use App\Services\ModuleEntitlementService;

class ProductCategoryPolicy
{
    public function __construct(
        protected ModuleEntitlementService $modules
    ) {}

    public function viewAny(User $user): bool
    {
        return $this->hasModule($user) && $user->canAccess('product_categories', 'index');
    }

    public function view(User $user, ProductCategory $productCategory): bool
    {
        return $this->hasModule($user) && $user->canAccess('product_categories', 'show');
    }

    public function create(User $user): bool
    {
        return $this->hasModule($user) && $user->canAccess('product_categories', 'create');
    }

    public function update(User $user, ProductCategory $productCategory): bool
    {
        return $this->hasModule($user) && $user->canAccess('product_categories', 'update');
    }

    public function delete(User $user, ProductCategory $productCategory): bool
    {
        return $this->hasModule($user) && $user->canAccess('product_categories', 'delete');
    }

    protected function hasModule(User $user): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $this->modules->memberHasModule($user->getOwnerMember(), 'products');
    }
}
