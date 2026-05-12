<?php

namespace App\Policies;

use App\Models\PriceList;
use App\Models\User;
use App\Services\ModuleEntitlementService;

class PriceListPolicy
{
    public function __construct(
        protected ModuleEntitlementService $modules
    ) {}

    public function viewAny(User $user): bool
    {
        return $this->hasModule($user) && $user->canAccess('price_lists', 'index');
    }

    public function view(User $user, PriceList $priceList): bool
    {
        return $this->hasModule($user) && $user->canAccess('price_lists', 'show');
    }

    public function create(User $user): bool
    {
        return $this->hasModule($user) && $user->canAccess('price_lists', 'create');
    }

    public function update(User $user, PriceList $priceList): bool
    {
        return $this->hasModule($user) && $user->canAccess('price_lists', 'update');
    }

    public function delete(User $user, PriceList $priceList): bool
    {
        return $this->hasModule($user) && $user->canAccess('price_lists', 'delete');
    }

    protected function hasModule(User $user): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $this->modules->memberHasModule($user->getOwnerMember(), 'products');
    }
}
