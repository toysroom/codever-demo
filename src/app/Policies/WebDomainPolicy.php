<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WebDomain;
use App\Services\ModuleEntitlementService;

class WebDomainPolicy
{
    public function __construct(
        protected ModuleEntitlementService $modules
    ) {}

    public function viewAny(User $user): bool
    {
        return $this->hasModule($user) && $user->canAccess('web_domains', 'index');
    }

    public function view(User $user, WebDomain $webDomain): bool
    {
        return $this->hasModule($user) && $user->canAccess('web_domains', 'show');
    }

    public function create(User $user): bool
    {
        return $this->hasModule($user) && $user->canAccess('web_domains', 'create');
    }

    public function update(User $user, WebDomain $webDomain): bool
    {
        return $this->hasModule($user) && $user->canAccess('web_domains', 'update');
    }

    public function delete(User $user, WebDomain $webDomain): bool
    {
        return $this->hasModule($user) && $user->canAccess('web_domains', 'delete');
    }

    protected function hasModule(User $user): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $this->modules->memberHasModule($user->getOwnerMember(), 'web');
    }
}
