<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AccountScope
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();

            if ($user->isAdmin()) {
                $request->attributes->set('account_member_id', null);
                $request->attributes->set('bypass_account_isolation', true);

                return $next($request);
            }

            $ownerMember = $user->getOwnerMember();

            if ($ownerMember) {
                $request->attributes->set('account_member_id', $ownerMember->id);

                if ($user->isSubMember() && $user->member) {
                    $request->attributes->set('sub_member_permissions', $user->member->permissions ?? []);
                }
            }
        }

        return $next($request);
    }
}
