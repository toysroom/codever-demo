<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WebServer;
use App\Services\ModuleEntitlementService;

class WebServerPolicy
{
    public function __construct(
        protected ModuleEntitlementService $modules
    ) {}

    public function viewAny(User $user): bool
    {
        return $this->hasModule($user) && $user->canAccess('web_servers', 'index');
    }

    public function view(User $user, WebServer $webServer): bool
    {
        return $this->hasModuleAndPermission($user, $webServer, 'show');
    }

    public function create(User $user): bool
    {
        return $this->hasModule($user) && $user->canAccess('web_servers', 'create');
    }

    public function update(User $user, WebServer $webServer): bool
    {
        return $this->hasModuleAndPermission($user, $webServer, 'update');
    }

    public function delete(User $user, WebServer $webServer): bool
    {
        return $this->hasModuleAndPermission($user, $webServer, 'delete');
    }

    protected function hasModule(User $user): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $this->modules->memberHasModule($user->getOwnerMember(), 'web');
    }

    protected function hasModuleAndPermission(User $user, WebServer $server, string $action): bool
    {
        if (! $this->hasModule($user) || ! $user->canAccess('web_servers', $action)) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        $owner = $user->getOwnerMember();

        return $owner !== null && (int) $server->member_id === (int) $owner->id;
    }
}
