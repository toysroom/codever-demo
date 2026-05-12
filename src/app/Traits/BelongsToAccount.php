<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait BelongsToAccount
{
    /**
     * Boot the BelongsToAccount trait.
     *
     * Aggiunge automaticamente il filtro account (member owner) a tutte le query del modello.
     * Admin vede tutto (bypass), altri utenti vedono solo i dati del proprio account.
     *
     * IMPORTANTE: Il model deve avere una colonna 'member_id' per funzionare.
     */
    protected static function bootBelongsToAccount(): void
    {
        static::addGlobalScope('account', function (Builder $builder) {
            if (Auth::check()) {
                $user = Auth::user();

                if ($user->isAdmin()) {
                    return;
                }

                $ownerMember = $user->getOwnerMember();

                if ($ownerMember) {
                    $builder->where('member_id', $ownerMember->id);
                } else {
                    $builder->whereRaw('1 = 0');
                }
            } else {
                $builder->whereRaw('1 = 0');
            }
        });
    }

    /**
     * Rimuove temporaneamente il global scope account.
     * Utile per query admin o query speciali.
     */
    public function scopeWithoutAccountScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope('account');
    }
}
