<?php

namespace App\Policies;

use App\Models\Member;
use App\Models\User;

class MemberPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isPlatformAdmin() || $user->isAdmin() || $user->can('settings.accounts.index');
    }

    public function view(User $user, Member $member): bool
    {
        return $this->manageOwner($user, $member);
    }

    public function create(User $user): bool
    {
        return $user->isPlatformAdmin() || $user->isAdmin() || $user->can('settings.accounts.index');
    }

    public function update(User $user, Member $member): bool
    {
        return $this->manageOwner($user, $member);
    }

    public function delete(User $user, Member $member): bool
    {
        return $this->manageOwner($user, $member);
    }

    protected function manageOwner(User $user, Member $member): bool
    {
        if (! $member->isOwner()) {
            return false;
        }

        return $user->isPlatformAdmin() || $user->isAdmin() || $user->can('settings.accounts.index');
    }
}
