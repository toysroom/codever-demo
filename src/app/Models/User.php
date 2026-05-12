<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasRoles, Notifiable, SoftDeletes, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'user_type',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    // Relazioni
    public function member(): HasOne
    {
        return $this->hasOne(Member::class);
    }

    public function customer(): HasOne
    {
        return $this->hasOne(Customer::class);
    }

    public function account(): HasOne
    {
        return $this->hasOne(Account::class);
    }

    // Helper methods
    public function isMember(): bool
    {
        return in_array($this->user_type, ['member', 'sub_member']);
    }

    public function isMemberOwner(): bool
    {
        return $this->user_type === 'member' && $this->member && $this->member->is_owner;
    }

    public function isSubMember(): bool
    {
        return $this->user_type === 'sub_member' || ($this->member && ! $this->member->is_owner);
    }

    public function isCustomer(): bool
    {
        return $this->user_type === 'customer';
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    /**
     * Amministratore di piattaforma (campo `user_type`), distinto dal ruolo Spatie `admin`.
     * Usato per UI condivisa (es. sidebar Settings) quando i permessi Spatie non sono ancora allineati.
     */
    public function isPlatformAdmin(): bool
    {
        return $this->user_type === 'admin';
    }

    /**
     * Verifica se l'utente ha accesso a un permesso specifico.
     *
     * Logica di verifica (in ordine di priorità):
     * 1. Admin → verifica custom permission, se null → true (bypass)
     * 2. Member Owner → sempre true sul proprio account (member owner)
     * 3. Sub-Member → verifica custom permission o JSON permission
     * 4. Customer → verifica Spatie Permission
     * 5. Default → verifica Spatie Permission
     */
    public function canAccess(string $domain, string $permission): bool
    {
        // Admin: verifica custom permission, se non esiste → bypass completo
        if ($this->isAdmin() && $this->account) {
            $customPermission = $this->account->hasCustomPermission($domain, $permission);
            if ($customPermission !== null) {
                return $customPermission; // Ha un override custom
            }

            return true; // Nessun override, bypass completo
        }

        // Member Owner: sempre accesso completo sul proprio account (member owner)
        if ($this->isMemberOwner()) {
            return true;
        }

        // Sub-Member: verifica custom permission o JSON
        if ($this->isSubMember() && $this->member) {
            return $this->member->canAccessDomain($domain, $permission);
        }

        // Customer e altri: verifica Spatie Permission
        $spatiePermission = "{$domain}.{$permission}";

        return $this->can($spatiePermission);
    }

    // Accessor per ottenere il profilo completo
    public function profile()
    {
        if ($this->isAdmin()) {
            return $this->account;
        }

        if ($this->isCustomer()) {
            return $this->customer;
        }

        return $this->member;
    }

    // Ottenere il Member Owner dell'account corrente (organizzazione cliente)
    public function getOwnerMember(): ?Member
    {
        // Admin piattaforma non ha member owner: vede tutto
        if ($this->isAdmin()) {
            return null;
        }

        if ($this->isMemberOwner()) {
            return $this->member;
        }

        if ($this->isSubMember() && $this->member) {
            return $this->member->ownerMember;
        }

        if ($this->isCustomer() && $this->customer) {
            return $this->customer->member;
        }

        return null;
    }
}
