<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Member extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'parent_member_id',
        'license_plan_id',
        'is_owner',
        'company_name',
        'company_vat',
        'first_name',
        'last_name',
        'subscription_started_at',
        'subscription_ends_at',
        'trial_ends_at',
        'is_trial',
        'max_customers',
        'max_sub_members',
        'settings',
        'permissions',
        'stripe_customer_id',
        'stripe_subscription_id',
        'subscription_status',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_owner' => 'boolean',
            'is_trial' => 'boolean',
            'subscription_started_at' => 'datetime',
            'subscription_ends_at' => 'datetime',
            'trial_ends_at' => 'datetime',
            'settings' => 'array',
            'permissions' => 'array',
        ];
    }

    // Relazioni
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function licensePlan(): BelongsTo
    {
        return $this->belongsTo(LicensePlan::class);
    }

    public function ownerMember(): BelongsTo
    {
        return $this->belongsTo(Member::class, 'parent_member_id');
    }

    public function subMembers(): HasMany
    {
        return $this->hasMany(Member::class, 'parent_member_id');
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    /**
     * Aziende collegate all’account (solo per member owner; righe con member_id = questo owner).
     */
    public function companies(): HasMany
    {
        return $this->hasMany(Company::class, 'member_id');
    }

    public function modules(): BelongsToMany
    {
        return $this->belongsToMany(Module::class, 'member_module')
            ->withPivot(['status', 'starts_at', 'ends_at', 'stripe_price_id', 'stripe_subscription_item_id'])
            ->withTimestamps();
    }

    public function scopeOwners($query)
    {
        return $query->where('is_owner', true)->whereNull('parent_member_id');
    }

    public function customPermissions(): MorphMany
    {
        return $this->morphMany(CustomPermission::class, 'permissionable');
    }

    // Helper methods
    public function isOwner(): bool
    {
        return $this->is_owner === true && $this->parent_member_id === null;
    }

    public function isSubMember(): bool
    {
        return $this->is_owner === false && $this->parent_member_id !== null;
    }

    // Ottenere il Member Owner (se stesso se è owner, altrimenti il parent)
    public function getOwner(): Member
    {
        return $this->isOwner() ? $this : $this->ownerMember;
    }

    /**
     * Verifica permessi per Sub-Members.
     *
     * Priorità:
     * 1. Se è Owner → sempre true
     * 2. Custom Permission (se esiste) → usa quello
     * 3. JSON permissions (backward compatibility) → usa quello
     * 4. Default → false
     */
    public function canAccessDomain(string $domain, string $permission): bool
    {
        if ($this->isOwner()) {
            return true; // Owner ha sempre accesso completo
        }

        if ($this->isSubMember()) {
            // Prima verifica custom_permissions (ha priorità)
            $customPermission = $this->customPermissions()
                ->active()
                ->forDomain($domain)
                ->forPermission($permission)
                ->first();

            if ($customPermission) {
                return $customPermission->granted;
            }

            $permissions = $this->permissions ?? [];
            if (isset($permissions['domains'][$domain][$permission])) {
                return (bool) $permissions['domains'][$domain][$permission];
            }

            return $this->user && $this->user->can("{$domain}.{$permission}");
        }

        return false;
    }

    /**
     * Assegna un permesso custom a questo Member (Sub-Member).
     */
    public function grantPermission(string $domain, string $permission, ?int $grantedBy = null, ?string $notes = null, ?\DateTimeInterface $expiresAt = null): CustomPermission
    {
        return $this->customPermissions()->updateOrCreate(
            [
                'domain' => $domain,
                'permission' => $permission,
            ],
            [
                'granted' => true,
                'granted_by' => $grantedBy ?? auth()->id(),
                'notes' => $notes,
                'expires_at' => $expiresAt,
            ]
        );
    }

    /**
     * Nega esplicitamente un permesso custom a questo Member (Sub-Member).
     */
    public function denyPermission(string $domain, string $permission, ?int $grantedBy = null, ?string $notes = null): CustomPermission
    {
        return $this->customPermissions()->updateOrCreate(
            [
                'domain' => $domain,
                'permission' => $permission,
            ],
            [
                'granted' => false,
                'granted_by' => $grantedBy ?? auth()->id(),
                'notes' => $notes,
                'expires_at' => null, // Se neghi, non ha senso avere scadenza
            ]
        );
    }

    /**
     * Rimuove un permesso custom (restore al comportamento di default).
     */
    public function removePermission(string $domain, string $permission): bool
    {
        return $this->customPermissions()
            ->forDomain($domain)
            ->forPermission($permission)
            ->delete() > 0;
    }

    // Activity Log
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'company_name',
                'first_name',
                'last_name',
                'license_plan_id',
                'parent_member_id',
                'max_customers',
                'max_sub_members',
                'permissions',
                'subscription_status',
                'is_trial',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
