<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Account extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'department',
        'role_level',
        'notes',
        'last_login_at',
        'settings',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_login_at' => 'datetime',
            'settings' => 'array',
        ];
    }

    // Relazioni
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function customPermissions(): MorphMany
    {
        return $this->morphMany(CustomPermission::class, 'permissionable');
    }

    // Helper
    public function fullName(): string
    {
        return trim("{$this->first_name} {$this->last_name}") ?: $this->user->name ?? '';
    }

    /**
     * Verifica se l'Account ha un permesso custom specifico.
     * Gli admin di default hanno tutti i permessi (bypass),
     * ma possono avere permessi custom per limitazioni specifiche.
     */
    public function hasCustomPermission(string $domain, string $permission): ?bool
    {
        $customPermission = $this->customPermissions()
            ->active()
            ->forDomain($domain)
            ->forPermission($permission)
            ->first();

        return $customPermission ? $customPermission->granted : null; // null = nessun override custom
    }

    /**
     * Assegna un permesso custom a questo Account.
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
     * Nega esplicitamente un permesso custom a questo Account.
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
                'expires_at' => null,
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
                'first_name',
                'last_name',
                'department',
                'role_level',
                'notes',
                'last_login_at',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
