<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class VerifyServiceKey
{
    public function handle(Request $request, Closure $next)
    {
        // allow preflight
        if ($request->isMethod('OPTIONS')) {
            return response('', 204);
        }

        // boleh baca dari config kalau mau cacheable:
        // $raw = (string) config('services.panel.trusted_service_keys', env('PANEL_TRUSTED_SERVICE_KEYS', ''));

        $raw = (string) env('PANEL_TRUSTED_SERVICE_KEYS', '');
        $allowed = array_filter(array_map('trim', explode(',', $raw)));

        // dev fallback: kalau kosong, jangan kunci
        if (!count($allowed)) {
            return $next($request);
        }

        $key = $request->header('X-SERVICE-KEY');
        if (!$key || !in_array($key, $allowed, true)) {
            return response()->json(['message' => 'Forbidden service'], 403);
        }

        return $next($request);
    }
}
