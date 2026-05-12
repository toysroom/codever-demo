<?php

namespace App\Http\Middleware;

use App\Services\ModuleEntitlementService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureModuleEnabled
{
    public function __construct(
        protected ModuleEntitlementService $moduleEntitlement
    ) {}

    public function handle(Request $request, Closure $next, string $slug): Response
    {
        $user = $request->user();
        if (! $user) {
            abort(403);
        }

        if ($user->isAdmin()) {
            return $next($request);
        }

        $owner = $user->getOwnerMember();
        if (! $this->moduleEntitlement->memberHasModule($owner, $slug)) {
            abort(403, __('Modulo non acquistato o non attivo.'));
        }

        return $next($request);
    }
}
