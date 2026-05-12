<?php

namespace App\Services;

use App\Models\Member;
use App\Models\Module;

class ModuleEntitlementService
{
    public function memberHasModule(?Member $ownerMember, string $moduleSlug): bool
    {
        if (! $ownerMember) {
            return false;
        }

        $owner = $ownerMember->isOwner() ? $ownerMember : $ownerMember->getOwner();

        return $owner->modules()
            ->where('modules.slug', $moduleSlug)
            ->where('modules.is_active', true)
            ->wherePivot('status', 'active')
            ->where(function ($q): void {
                $q->whereNull('member_module.ends_at')
                    ->orWhere('member_module.ends_at', '>', now());
            })
            ->exists();
    }

    /**
     * @return array<int, array{slug: string, name: string}>
     */
    public function activeModulesForOwner(?Member $ownerMember): array
    {
        if (! $ownerMember) {
            return [];
        }

        $owner = $ownerMember->isOwner() ? $ownerMember : $ownerMember->getOwner();

        return $owner->modules()
            ->where('modules.is_active', true)
            ->wherePivot('status', 'active')
            ->where(function ($q): void {
                $q->whereNull('member_module.ends_at')
                    ->orWhere('member_module.ends_at', '>', now());
            })
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Module $m) => ['slug' => $m->slug, 'name' => $m->name])
            ->values()
            ->all();
    }
}
