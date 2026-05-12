<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WebHostingProvider;
use App\Services\ModuleEntitlementService;

class WebHostingProviderPolicy
{
    public function __construct(
        protected ModuleEntitlementService $modules
    ) {}

    public function viewAny(User $user): bool
    {
        return $this->hasModule($user) && $user->canAccess('web_hosting_providers', 'index');
    }

    public function view(User $user, WebHostingProvider $webHostingProvider): bool
    {
        return $this->hasModule($user) && $user->canAccess('web_hosting_providers', 'show');
    }

    public function create(User $user): bool
    {
        return $this->hasModule($user) && $user->canAccess('web_hosting_providers', 'create');
    }

    public function update(User $user, WebHostingProvider $webHostingProvider): bool
    {
        return $this->hasModule($user) && $user->canAccess('web_hosting_providers', 'update');
    }

    public function delete(User $user, WebHostingProvider $webHostingProvider): bool
    {
        return $this->hasModule($user) && $user->canAccess('web_hosting_providers', 'delete');
    }

    protected function hasModule(User $user): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $this->modules->memberHasModule($user->getOwnerMember(), 'web');
    }
}
