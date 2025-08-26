<?php
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

        $currentLevel = $this->resolveLevel($user, $request->input('level_id'), $request->input('level_name'));
        if (!$currentLevel) {
            return response()->json([
                'success' => false,
                'message' => 'Level tidak ditemukan. Sertakan level_id atau level_name yang valid.'
            ], 422);
        }

        $customClaims = [
            'level_id' => $currentLevel->id,
            'level_name' => $currentLevel->nama_level,
        ];
        $token = JWTAuth::claims($customClaims)->fromUser($user);

        $user->update(['last_login_at' => Carbon::now()]);

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60,
            'user' => [
                'id' => $user->id,
                'nama' => $user->nama,
                'email' => $user->email,
                'status' => $user->status,
                'levels' => $user->levels,
                'last_login_at' => optional($user->last_login_at)->toIso8601String(),
            ],
            'current_level' => [
                'id' => $currentLevel->id,
                'name' => $currentLevel->nama_level,
                'default_homepage' => $currentLevel->default_homepage ?? 'dashboard',
            ],
            'permissions' => $this->getLevelPermissions($currentLevel->id),
            'menus' => $this->buildAllowedMenuTree($currentLevel->id),
        ]);
    }

    public function me()
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated. Silakan login.'], 401);
        }

        $claims = JWTAuth::getPayload();
        $levelId = (int) $claims->get('level_id');
        $levelName = $claims->get('level_name');

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'nama' => $user->nama,
                'email' => $user->email,
                'status' => $user->status,
                'levels' => $user->levels,
                'last_login_at' => optional($user->last_login_at)->toIso8601String(),
            ],
            'level' => [
                'id' => $levelId,
                'name' => $levelName,
            ],
            'permissions' => $this->getLevelPermissions($levelId),
            'menus' => $this->buildAllowedMenuTree($levelId),
        ]);
    }

    public function refresh()
    {
        try {
            $newToken = JWTAuth::parseToken()->refresh();
            return response()->json([
                'success' => true,
                'token' => $newToken,
                'token_type' => 'bearer',
                'expires_in' => JWTAuth::factory()->getTTL() * 60,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Gagal refresh token'], 401);
        }
    }

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

    private function resolveLevel(UserManagement $user, $levelId = null, $levelName = null): ?LevelUser
    {
        if (!empty($levelId)) {
            return LevelUser::find($levelId);
        }
        if (!empty($levelName)) {
            return LevelUser::where('nama_level', $levelName)->first();
        }
        if ($user->role) {
            if ($lvl = LevelUser::find($user->role)) return $lvl;
        }
        $list = $user->levels ?? [];
        if (!empty($list)) {
            return LevelUser::whereIn('nama_level', (array) $list)->first();
        }
        return null;
    }

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
     * Build pohon menu & filter hanya yang diizinkan (allowed sendiri atau punya descendant allowed).
     * NB: implementasi ulang supaya tidak pakai “property dinamis” pada model.
     */
    private function buildAllowedMenuTree(int $levelId): array
    {
        $allowedIds = LevelNavItemPermission::where('level_user_id', $levelId)
            ->where('access', true)
            ->pluck('nav_item_id')
            ->map(fn($v) => (int) $v)
            ->toArray();

        $items = NavItem::active()
            ->orderBy('parent_id')
            ->orderBy('order_number')
            ->get(['id','label','slug','icon','parent_id','order_number']);

        // Map id -> node dasar
        $nodes = [];
        foreach ($items as $it) {
            $nodes[$it->id] = [
                'id' => (int) $it->id,
                'label' => $it->label,
                'slug' => $it->slug,
                'icon' => $it->icon,
                'parent_id' => $it->parent_id ? (int) $it->parent_id : null,
                'order_number' => (int) $it->order_number,
                'allowed' => in_array((int) $it->id, $allowedIds, true),
                'children' => [],
            ];
        }

        // Bangun adjacency (parent -> [child ids])
        $childrenMap = [];
        foreach ($nodes as $id => $n) {
            $pid = $n['parent_id'];
            $childrenMap[$pid ?? 0][] = $id; // pakai 0 utk root
        }

        // Recursively build + filter
        $build = function ($parentId) use (&$build, &$nodes, &$childrenMap): array {
            $childIds = $childrenMap[$parentId ?? 0] ?? [];
            $out = [];
            foreach ($childIds as $cid) {
                $node = $nodes[$cid];
                $node['children'] = $build($cid);
                $keep = $node['allowed'] || count($node['children']) > 0;
                if ($keep) $out[] = $node;
            }
            return $out;
        };

        return $build(null);
    }
}
