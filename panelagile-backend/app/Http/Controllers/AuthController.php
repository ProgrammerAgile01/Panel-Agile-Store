<?php
// app/Http/Controllers/AuthController.php

namespace App\Http\Controllers;

use App\Models\UserManagement;
use App\Models\LevelUser;
use App\Models\LevelNavItemPermission;
use App\Models\NavItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * POST /api/auth/login
     * body: { email, password, level_id? | level_name? }
     * - Login & pilih level (role) yang aktif untuk sesi ini.
     */
    public function login(Request $request)
    {
        $v = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
            'level_id' => 'nullable|integer|exists:sys_level_user,id',
            'level_name' => 'nullable|string',
        ]);

        if ($v->fails()) {
            return response()->json(['success' => false, 'message' => $v->errors()->first()], 422);
        }

        $user = UserManagement::where('email', $request->email)->first();
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Email atau password salah'], 401);
        }

        // Tentukan level aktif
        $currentLevel = $this->resolveLevel($user, $request->input('level_id'), $request->input('level_name'));
        if (!$currentLevel) {
            return response()->json([
                'success' => false,
                'message' => 'Level tidak ditemukan. Sertakan level_id atau level_name yang valid.'
            ], 422);
        }

        // Buat token dengan klaim level aktif
        $customClaims = [
            'level_id' => $currentLevel->id,
            'level_name' => $currentLevel->nama_level,
        ];

        $token = JWTAuth::claims($customClaims)->fromUser($user);

        // Update last_login
        $user->update(['last_login_at' => Carbon::now()]);

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60, // detik
            'user' => [
                'id' => $user->id,
                'nama' => $user->nama,
                'email' => $user->email,
                'status' => $user->status,
                'levels' => $user->levels,
            ],
            'current_level' => [
                'id' => $currentLevel->id,
                'name' => $currentLevel->nama_level,
                'default_homepage' => $currentLevel->default_homepage,
            ],
            'permissions' => $this->getLevelPermissions($currentLevel->id),
            'menus' => $this->buildAllowedMenuTree($currentLevel->id),
        ]);
    }

    /**
     * GET /api/auth/me
     * - Ambil user & klaim dari token aktif.
     */
    public function me()
    {
        // Pastikan token dikirim di header Authorization: Bearer <token>
        $user = JWTAuth::parseToken()->authenticate();
        $claims = JWTAuth::getPayload();

        $levelId = $claims->get('level_id');

        return response()->json([
            'success' => true,
            'user' => $user,
            'level' => [
                'id' => $levelId,
                'name' => $claims->get('level_name'),
            ],
            'permissions' => $this->getLevelPermissions($levelId),
            'menus' => $this->buildAllowedMenuTree($levelId),
        ]);
    }

    /**
     * POST /api/auth/refresh
     * - Refresh token dari token aktif di header.
     */
    public function refresh()
    {
        try {
            $newToken = JWTAuth::parseToken()->refresh();

            return response()->json([
                'success' => true,
                'token' => $newToken,
                'token_type' => 'bearer',
                'expires_in' => JWTAuth::factory()->getTTL() * 60, // detik
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Gagal refresh token'], 401);
        }
    }

    /**
     * POST /api/auth/logout
     * - Invalidate token aktif (blacklist).
     */
    public function logout()
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
            return response()->json(['success' => true, 'message' => 'Logout berhasil']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Gagal logout'], 401);
        }
    }

    /* ================= Helpers ================= */

    /**
     * Menentukan LevelUser aktif berdasarkan prioritas:
     * 1) level_id  2) level_name  3) user->role  4) levels_json
     */
    private function resolveLevel(UserManagement $user, $levelId = null, $levelName = null): ?LevelUser
    {
        if (!empty($levelId)) {
            return LevelUser::find($levelId);
        }
        if (!empty($levelName)) {
            return LevelUser::where('nama_level', $levelName)->first();
        }
        if ($user->role) {
            return LevelUser::find($user->role);
        }
        if (!empty($user->levels_json)) {
            return LevelUser::whereIn('nama_level', $user->levels_json)->first();
        }
        return null;
    }

    /**
     * Ambil daftar permission per menu (slug/label) untuk level tertentu.
     * Menggunakan tabel sys_permissions sesuai model LevelNavItemPermission.
     */
    private function getLevelPermissions(int $levelId): array
    {
        $rows = LevelNavItemPermission::query()
            ->select([
                'sys_permissions.*',
                'mst_nav_items.slug',
                'mst_nav_items.label',
            ])
            ->join('mst_nav_items', 'mst_nav_items.id', '=', 'sys_permissions.nav_item_id')
            ->where('sys_permissions.level_user_id', $levelId)
            ->where('sys_permissions.access', true)
            ->orderBy('mst_nav_items.order_number')
            ->get();

        return $rows->map(fn($r) => [
            'nav_item_id' => (int) $r->nav_item_id,
            'slug' => $r->slug,
            'label' => $r->label,
            'access' => (bool) $r->access,
            'view' => (bool) $r->view,
            'add' => (bool) $r->add,
            'edit' => (bool) $r->edit,
            'delete' => (bool) $r->delete,
            'approve' => (bool) $r->approve,
            'print' => (bool) $r->print,
        ])->values()->all();
    }

    /**
     * Bangun tree menu aktif lalu filter yang diizinkan oleh permission level.
     */
    private function buildAllowedMenuTree(int $levelId): array
    {
        // Ambil nav_item_id yang allowed
        $allowed = LevelNavItemPermission::where('level_user_id', $levelId)
            ->where('access', true)
            ->pluck('nav_item_id')
            ->toArray();

        // Semua item aktif
        $items = NavItem::active()
            ->orderBy('parent_id')
            ->orderBy('order_number')
            ->get();

        // Index by id, siapkan node
        $byId = $items->keyBy('id');
        $tree = [];

        foreach ($items as $it) {
            $node = [
                'id' => $it->id,
                'label' => $it->label,
                'slug' => $it->slug,
                'icon' => $it->icon,
                'parent_id' => $it->parent_id,
                'order_number' => $it->order_number,
                'allowed' => in_array($it->id, $allowed, true),
                'children' => [],
            ];
            $byId[$it->id]->_node = $node;
        }

        // Susun parent-child
        foreach ($items as $it) {
            $node = $byId[$it->id]->_node;
            if ($it->parent_id && isset($byId[$it->parent_id])) {
                $parent = $byId[$it->parent_id]->_node;
                $parent['children'][] = $node;
                $byId[$it->parent_id]->_node = $parent;
            } else {
                $tree[] = $node;
            }
        }

        // Filter cabang yang tidak punya allowed descendant
        $filterFn = function (array $nodes) use (&$filterFn) {
            $res = [];
            foreach ($nodes as $n) {
                $n['children'] = $filterFn($n['children']);
                $keep = $n['allowed'] || count($n['children']) > 0;
                if ($keep) {
                    $res[] = $n;
                }
            }
            return $res;
        };

        return $filterFn($tree);
    }
}
