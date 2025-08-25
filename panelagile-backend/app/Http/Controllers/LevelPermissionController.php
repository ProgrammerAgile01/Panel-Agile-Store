<?php

namespace App\Http\Controllers;

use App\Models\LevelUser;
use App\Models\NavItem;
use App\Models\LevelNavItemPermission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class LevelPermissionController extends Controller
{
    /** Resolve level id dari ?level_id / ?level_name, atau fallback jika hanya ada 1 level */
    private function resolveLevelId(Request $request): ?int
    {
        $levelId = (int) $request->query('level_id', 0);

        if (!$levelId) {
            $levelName = trim((string) $request->query('level_name', ''));
            if ($levelName !== '') {
                $levelId = (int) DB::table('sys_level_user')
                    ->where('nama_level', $levelName)
                    ->value('id');
            }
        }

        if (!$levelId) {
            $ids = DB::table('sys_level_user')->select('id')->limit(2)->pluck('id');
            if ($ids->count() === 1) {
                $levelId = (int) $ids->first();
            }
        }

        if (!$levelId)
            return null;
        return LevelUser::query()->whereKey($levelId)->exists() ? $levelId : null;
    }

    /** GET /api/level-permissions?level_id=... | ?level_name=... */
    public function index(Request $request): JsonResponse
    {
        $levelId = $this->resolveLevelId($request);
        if (!$levelId) {
            return response()->json([
                'success' => false,
                'message' => 'level_id tidak valid. Gunakan ?level_id={id} atau ?level_name={nama_level}',
            ], 422);
        }

        // Ambil nav items (urut parent->child)
        $navs = NavItem::query()
            ->with('parent')
            ->orderBy('parent_id')
            ->orderBy('order_number')
            ->orderBy('label')
            ->get();

        // Ambil permission existing utk level ini, keyBy nav_item_id
        $existing = LevelNavItemPermission::where('level_user_id', $levelId)
            ->get()
            ->keyBy('nav_item_id');

        // Map ke bentuk yang dipakai frontend (NULL-SAFE untuk cegah 500)
        $data = $navs->map(function (NavItem $n) use ($existing, $levelId) {
            $perm = $existing->get($n->id);

            return [
                'nav_item' => [
                    'id' => $n->id,
                    'group' => $n->parent_id ? ($n->parent?->label ?? 'Other') : ($n->label ?? 'Other'),
                    'name' => $n->label,
                    'path' => $n->slug,
                    'description' => null,
                    'order_number' => $n->order_number,
                ],
                'permission' => [
                    'level_id' => $levelId,
                    'nav_item_id' => $n->id,
                    'access' => (bool) ($perm?->access ?? false),
                    'view' => (bool) ($perm?->view ?? false),
                    'add' => (bool) ($perm?->add ?? false),
                    'edit' => (bool) ($perm?->edit ?? false),
                    'delete' => (bool) ($perm?->delete ?? false),
                    'approve' => (bool) ($perm?->approve ?? false),
                    'print' => (bool) ($perm?->print ?? false),
                ],
            ];
        });

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $data]);
    }

    /** POST /api/level-permissions/bulk */
    public function bulkUpsert(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'level_id' => ['required', 'integer', Rule::exists('sys_level_user', 'id')],
            'permissions' => ['required', 'array', 'min:1'],
            'permissions.*.nav_item_id' => ['required', 'integer', Rule::exists('mst_nav_items', 'id')],
            'permissions.*.access' => 'required|boolean',
            'permissions.*.view' => 'required|boolean',
            'permissions.*.add' => 'required|boolean',
            'permissions.*.edit' => 'required|boolean',
            'permissions.*.delete' => 'required|boolean',
            'permissions.*.approve' => 'required|boolean',
            'permissions.*.print' => 'required|boolean',
        ]);

        $levelId = (int) $validated['level_id'];

        DB::transaction(function () use ($levelId, $validated) {
            foreach ($validated['permissions'] as $r) {
                $payload = [
                    'access' => (bool) $r['access'],
                    'view' => $r['access'] ? (bool) $r['view'] : false,
                    'add' => $r['access'] ? (bool) $r['add'] : false,
                    'edit' => $r['access'] ? (bool) $r['edit'] : false,
                    'delete' => $r['access'] ? (bool) $r['delete'] : false,
                    'approve' => $r['access'] ? (bool) $r['approve'] : false,
                    'print' => $r['access'] ? (bool) $r['print'] : false,
                ];

                LevelNavItemPermission::updateOrCreate(
                    ['level_user_id' => $levelId, 'nav_item_id' => (int) $r['nav_item_id']],
                    $payload
                );
            }
        });

        return response()->json(['success' => true, 'message' => 'Matrix permission disimpan']);
    }

    /** GET /api/level-permissions/stats?level_id=... */
    public function stats(Request $request): JsonResponse
    {
        $levelId = $this->resolveLevelId($request);
        if (!$levelId) {
            return response()->json([
                'success' => false,
                'message' => 'level_id tidak valid. Gunakan ?level_id={id} atau ?level_name={nama_level}',
            ], 422);
        }

        $total = NavItem::count();
        $granted = LevelNavItemPermission::where('level_user_id', $levelId)
            ->where('access', true)
            ->count();

        return response()->json([
            'success' => true,
            'data' => ['total_nav_items' => $total, 'granted_access' => $granted],
        ]);
    }

    /** GET /api/level-permissions/export-csv?level_id=... */
    public function exportCsv(Request $request)
    {
        $levelId = $this->resolveLevelId($request);
        if (!$levelId) {
            return response()->json([
                'success' => false,
                'message' => 'level_id tidak valid. Gunakan ?level_id={id} atau ?level_name={nama_level}',
            ], 422);
        }

        $navs = NavItem::query()
            ->with('parent')
            ->orderBy('parent_id')
            ->orderBy('order_number')
            ->orderBy('label')
            ->get();

        $existing = LevelNavItemPermission::where('level_user_id', $levelId)
            ->get()->keyBy('nav_item_id');

        $header = ['Group', 'Name', 'Path', 'Access', 'View', 'Add', 'Edit', 'Delete', 'Approve', 'Print'];
        $csv = implode(',', $header) . "\n";

        foreach ($navs as $n) {
            $p = $existing->get($n->id);
            $row = [
                'group' => $n->parent_id ? ($n->parent?->label ?? 'Other') : ($n->label ?? 'Other'),
                'name' => $n->label,
                'path' => $n->slug,
                'access' => $p?->access ? 1 : 0,
                'view' => $p?->view ? 1 : 0,
                'add' => $p?->add ? 1 : 0,
                'edit' => $p?->edit ? 1 : 0,
                'delete' => $p?->delete ? 1 : 0,
                'approve' => $p?->approve ? 1 : 0,
                'print' => $p?->print ? 1 : 0,
            ];

            $csv .= sprintf(
                "\"%s\",\"%s\",\"%s\",%d,%d,%d,%d,%d,%d,%d\n",
                str_replace('"', '""', $row['group']),
                str_replace('"', '""', $row['name']),
                str_replace('"', '""', $row['path']),
                $row['access'],
                $row['view'],
                $row['add'],
                $row['edit'],
                $row['delete'],
                $row['approve'],
                $row['print']
            );
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename=permissions_level_' . $levelId . '.csv',
        ]);
    }
}
