<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\JwtService;
use App\Models\User;
use Throwable;

class JwtAuthenticate
{
    public function __construct(protected JwtService $jwt)
    {
    }

    public function handle(Request $request, Closure $next)
    {
        try {
            $auth = (string) $request->header('Authorization', '');

            // Terima "Bearer   <token>" (dengan spasi banyak) & case-insensitive
            if (!preg_match('/^Bearer\s+(.+)$/i', $auth, $m)) {
                return response()->json(['message' => 'Unauthorized (no bearer)'], 401);
            }

            $token = trim($m[1]);
            if ($token === '') {
                return response()->json(['message' => 'Unauthorized (empty token)'], 401);
            }

            $decoded = $this->jwt->decodeAccessToken($token);

            $userId = isset($decoded->sub) ? (int) $decoded->sub : 0;
            if ($userId <= 0) {
                return response()->json(['message' => 'Invalid token: no subject'], 401);
            }

            $user = User::find($userId);
            if (!$user) {
                return response()->json(['message' => 'User not found'], 401);
            }

            auth()->setUser($user);
            return $next($request);
        } catch (Throwable $e) {
            // PAKAI config('app.debug') — method hasDebugModeEnabled() tidak ada
            $debug = (bool) config('app.debug');
            return response()->json([
                'message' => 'Invalid token',
                'error' => $debug ? $e->getMessage() : 'token_error',
            ], 401);
        }
    }
}
