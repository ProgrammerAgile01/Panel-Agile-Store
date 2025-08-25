<?php

namespace App\Http\Middleware;

use App\Models\LevelNavItemPermission;
use App\Models\NavItem;
use Closure;
use Tymon\JWTAuth\Facades\JWTAuth;

class PermissionMiddleware
{
    /**
     * Pakai seperti: ->middleware('permission:view,product')
     * action: access|view|add|edit|delete|approve|print
     * navSlug: slug pada mst_nav_items
     */
    public function handle($request, Closure $next, $action, $navSlug)
    {
        try {
            $payload = JWTAuth::parseToken()->getPayload();
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $levelId = $payload->get('level_id');
        if (!$levelId) {
            return response()->json(['success' => false, 'message' => 'Level tidak terdeteksi di token'], 403);
        }

        $navItem = NavItem::where('slug', $navSlug)->first();
        if (!$navItem) {
            return response()->json(['success' => false, 'message' => 'Nav item tidak ditemukan'], 404);
        }

        $perm = LevelNavItemPermission::where('level_user_id', $levelId)
            ->where('nav_item_id', $navItem->id)
            ->first();

        if (!$perm || !$perm->access) {
            return response()->json(['success' => false, 'message' => 'Tidak memiliki akses menu'], 403);
        }

        $allowed = match ($action) {
            'view' => (bool) $perm->view,
            'add' => (bool) $perm->add,
            'edit' => (bool) $perm->edit,
            'delete' => (bool) $perm->delete,
            'approve' => (bool) $perm->approve,
            'print' => (bool) $perm->print,
            'access' => (bool) $perm->access,
            default => false,
        };

        if (!$allowed) {
            return response()->json([
                'success' => false,
                'message' => "Aksi '{$action}' tidak diizinkan untuk menu {$navSlug}"
            ], 403);
        }

        return $next($request);
    }
}
