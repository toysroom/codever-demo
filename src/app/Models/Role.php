<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\Permission\Models\Role as SpatieRole;

/**
 * Modello ruolo applicativo (estende Spatie). Stato UI e descrizione vivono in `role_metadata`.
 */
class Role extends SpatieRole
{
    protected $fillable = [
        'name',
        'guard_name',
    ];

    protected static function booted(): void
    {
        static::created(function (Role $role): void {
            RoleMetadata::query()->firstOrCreate(
                ['role_id' => $role->id],
                [
                    'is_active' => true,
                    'is_disabled' => in_array($role->name, ['admin', 'customer'], true),
                    'priority' => self::defaultPriorityForName($role->name),
                    'description' => null,
                ],
            );
        });
    }

    public static function defaultPriorityForName(string $roleName): int
    {
        return match ($roleName) {
            'admin' => 100,
            'member_owner' => 80,
            'sub_member' => 70,
            'member' => 60,
            'customer' => 40,
            default => 10,
        };
    }

    /**
     * @return HasOne<RoleMetadata, $this>
     */
    public function metadata(): HasOne
    {
        return $this->hasOne(RoleMetadata::class);
    }
}
