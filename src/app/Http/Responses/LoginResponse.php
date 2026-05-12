<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function toResponse($request)
    {
        $user = $request->user();

        try {
            // Admin va a dashboard admin (se esiste, altrimenti dashboard)
            if ($user->isAdmin()) {
                try {
                    return redirect()->intended(route('admin.dashboard'));
                } catch (\Illuminate\Routing\Exceptions\RouteNotFoundException $e) {
                    return redirect()->intended(route('dashboard'));
                }
            }

            // Member Owner e Sub-Member vanno a dashboard app
            if ($user->isMember()) {
                return redirect()->intended(route('dashboard'));
            }

            // Customer va a dashboard customer (se esiste, altrimenti dashboard)
            if ($user->isCustomer()) {
                try {
                    return redirect()->intended(route('customer.dashboard'));
                } catch (\Illuminate\Routing\Exceptions\RouteNotFoundException $e) {
                    return redirect()->intended(route('dashboard'));
                }
            }
        } catch (\Exception $e) {
            // Fallback in caso di errori
        }

        // Default
        return redirect()->intended(route('dashboard'));
    }
}
