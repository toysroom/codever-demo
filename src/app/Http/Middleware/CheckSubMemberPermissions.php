<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckSubMemberPermissions
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $domain, string $permission): Response
    {
        $user = Auth::user();

        // Admin e Member Owner hanno sempre accesso
        if ($user->isAdmin() || $user->isMemberOwner()) {
            return $next($request);
        }

        // Verifica permessi per Sub-Members
        if ($user->isSubMember() && $user->member) {
            if (! $user->member->canAccessDomain($domain, $permission)) {
                abort(403, 'Non hai i permessi per questa azione');
            }
        }

        // Customer non dovrebbero mai arrivare qui (dovrebbero essere bloccati prima)
        if ($user->isCustomer()) {
            abort(403, 'Accesso negato');
        }

        return $next($request);
    }
}
