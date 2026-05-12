<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocaleFromSession
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->hasSession() && $request->session()->has('locale')) {
            $locale = (string) $request->session()->get('locale');
            if (in_array($locale, ['it', 'en'], true)) {
                app()->setLocale($locale);
            }
        }

        return $next($request);
    }
}
