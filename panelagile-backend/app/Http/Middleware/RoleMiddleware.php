<?php

namespace App\Http\Middleware;

use Closure;
use Tymon\JWTAuth\Facades\JWTAuth;

class RoleMiddleware
{
    /**
     * Pakai seperti: ->middleware('role:Admin,Owner')
     */
    public function handle($request, Closure $next, ...$allowedRoleNames)
    {
        try {
            // Pastikan token valid (akan throw jika tidak)
            $payload = JWTAuth::parseToken()->getPayload();
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $currentLevelName = $payload->get('level_name');

        if (!$currentLevelName || !in_array($currentLevelName, $allowedRoleNames, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak: role tidak diizinkan'
            ], 403);
        }

        return $next($request);
    }
}
