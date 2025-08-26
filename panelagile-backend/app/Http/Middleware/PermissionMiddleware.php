<?php

namespace App\Http\Middleware;

use App\Models\LevelNavItemPermission;
use App\Models\NavItem;
use Closure;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Tymon\JWTAuth\Facades\JWTAuth;

class PermissionMiddleware
{
    /**
     * Pakai di routes: ->middleware('permission:view,level-user')
     */
    public function handle($request, Closure $next, $action, $navSlug)
    {
        try {
            $payload = JWTAuth::parseToken()->getPayload();
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $levelId = (int) ($payload->get('level_id') ?? 0);
        $levelName = (string) ($payload->get('level_name') ?? '');

        if (!$levelId) {
            return response()->json(['success' => false, 'message' => 'Level tidak terdeteksi di token'], 403);
        }

        // Normalisasi slug: trim, lower, spasi/underscore -> hyphen, dedup hyphen
        $slugKey = Str::of((string)$navSlug)
            ->trim()
            ->lower()
            ->replace(' ', '-')
            ->replace('_', '-')
            ->replace('--', '-')
            ->value();

        // Cari nav item case-insensitive + trim
        $navItem = NavItem::query()
            ->whereRaw('LOWER(TRIM(slug)) = ?', [$slugKey])
            ->first();

        if (!$navItem) {
            Log::warning('PermissionMiddleware: NAV SLUG NOT FOUND', [
                'param'      => $navSlug,
                'normalized' => $slugKey,
                'level_id'   => $levelId,
                'level_name' => $levelName,
            ]);
            return response()->json([
                'success' => false,
                'message' => "Menu dengan slug '{$slugKey}' tidak ditemukan di mst_nav_items."
            ], 422);
        }

        $perm = LevelNavItemPermission::where('level_user_id', $levelId)
            ->where('nav_item_id', $navItem->id)
            ->first();

        if (!$perm || !$perm->access) {
            Log::info('PermissionMiddleware: NO ACCESS', [
                'level_id' => $levelId,
                'nav_id'   => $navItem->id,
                'slug'     => $slugKey,
            ]);
            return response()->json(['success' => false, 'message' => 'Tidak memiliki akses menu'], 403);
        }

        $allowed = match ($action) {
            'view'    => (bool) $perm->view,
            'add'     => (bool) $perm->add,
            'edit'    => (bool) $perm->edit,
            'delete'  => (bool) $perm->delete,
            'approve' => (bool) $perm->approve,
            'print'   => (bool) $perm->print,
            'access'  => (bool) $perm->access,
            default   => false,
        };

        Log::debug('PermissionMiddleware: CHECK', [
            'action'  => $action,
            'allowed' => $allowed,
            'level'   => ['id' => $levelId, 'name' => $levelName],
            'nav'     => ['id' => $navItem->id, 'slug' => $slugKey],
            'flags'   => [
                'access' => (bool)$perm->access,
                'view'   => (bool)$perm->view,
                'add'    => (bool)$perm->add,
                'edit'   => (bool)$perm->edit,
                'delete' => (bool)$perm->delete,
                'approve'=> (bool)$perm->approve,
                'print'  => (bool)$perm->print,
            ],
        ]);

        if (!$allowed) {
            return response()->json([
                'success' => false,
                'message' => "Aksi '{$action}' tidak diizinkan untuk menu {$slugKey}"
            ], 403);
        }

        return $next($request);
    }
}
