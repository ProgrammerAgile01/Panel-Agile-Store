<?php

// app/Http/Controllers/NavItemController.php
namespace App\Http\Controllers;

use App\Models\NavItem;
use App\Models\LevelNavItemPermission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;

class NavItemController extends Controller
{
    /**
     * GET /api/nav-items
     * - Default (tanpa query): kembalikan daftar FLAT untuk Matrix Level (TANPA filter role).
     * - ?format=tree : kembalikan TREE untuk Header (DENGAN filter role/permission dari JWT).
     */
   

    public function index(Request $request): JsonResponse
    {
        $format = $request->query('format', 'flat'); // 'flat' | 'tree'

        if ($format === 'tree') {
            // ====== MODE HEADER: FILTER BERDASARKAN ROLE ======
            $levelId = null;
            try {
                if (JWTAuth::getToken()) {
                    $claims = JWTAuth::getPayload();
                    $levelId = (int) $claims->get('level_id');
                }
            } catch (\Throwable $e) {
                // no/invalid token → tidak ada menu
            }

            if (!$levelId) {
                return response()->json(['success' => true, 'data' => []]);
            }

            $tree = $this->buildAllowedMenuTree($levelId);
            return response()->json(['success' => true, 'data' => $tree]);
        }

        // ====== MODE MATRIX LEVEL (DEFAULT): FLAT TANPA FILTER ROLE ======
        $hideParents = $request->boolean('hide_parents', true);

        // Query dasar nav items + parent label (group)
        $rows = DB::table('mst_nav_items as n')
            ->leftJoin('mst_nav_items as p', 'p.id', '=', 'n.parent_id')
            ->where('n.is_active', true)
            ->selectRaw('
                n.id,
                n.parent_id,
                COALESCE(p.label, n.label)  as _group,
                n.label                      as _name,
                n.slug                       as _slug,
                n.order_number               as _order_number
            ')
            ->orderByRaw('COALESCE(p.label, n.label) asc')
            ->orderBy('n.order_number')
            ->orderBy('n.label')
            ->get();

        // Sembunyikan parent yang punya child; parent tanpa child tetap tampil
        if ($hideParents) {
            $hasChild = DB::table('mst_nav_items')
                ->select('parent_id', DB::raw('COUNT(*) as cnt'))
                ->whereNotNull('parent_id')
                ->groupBy('parent_id')
                ->pluck('cnt', 'parent_id'); // [parent_id => cnt]

            $rows = $rows->filter(function ($r) use ($hasChild) {
                return $r->parent_id !== null || !$hasChild->has($r->id);
            })->values();
        }

        // Output FLAT untuk Matrix Level
        $data = $rows->map(function ($r) {
            return [
                'id' => (int) $r->id,
                'group' => $r->_group,      // label parent (atau label diri jika mandiri)
                'name' => $r->_name,        // label item
                'slug' => $r->_slug,        // penting: konsisten 'slug'
                'description' => '',
                'order_number' => (int) $r->_order_number,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /** POST /api/nav-items */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'label' => 'required|string|max:100',
            'slug' => 'required|string|max:100|unique:mst_nav_items,slug',
            'icon' => 'nullable|string|max:100',
            'parent_id' => 'nullable|exists:mst_nav_items,id', // perbaiki nama tabel
            'order_number' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $item = NavItem::create($data);
        return response()->json(['message' => 'Created', 'data' => $item], 201);
    }

    /** GET /api/nav-items/{nav_item} */
    public function show(NavItem $nav_item): JsonResponse
    {
        $nav_item->load(['children' => fn($q) => $q->orderBy('order_number')]);
        return response()->json(['data' => $nav_item]);
    }

    /** PUT /api/nav-items/{nav_item} */
    public function update(Request $request, NavItem $nav_item): JsonResponse
    {
        $data = $request->validate([
            'label' => 'sometimes|required|string|max:100',
            'slug' => 'sometimes|required|string|max:100|unique:mst_nav_items,slug,' . $nav_item->id,
            'icon' => 'nullable|string|max:100',
            'parent_id' => 'nullable|exists:mst_nav_items,id', // perbaiki nama tabel
            'order_number' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $nav_item->update($data);
        return response()->json(['message' => 'Updated', 'data' => $nav_item]);
    }

    /** DELETE /api/nav-items/{nav_item} */
    public function destroy(NavItem $nav_item): JsonResponse
    {
        $nav_item->delete();
        return response()->json(['message' => 'Deleted']);
    }

    /* ================= Helpers untuk mode tree (header) ================= */

    /** Ambil ID nav item yang diizinkan utk level (access = true). */
    private function allowedIds(int $levelId): array
    {
        return LevelNavItemPermission::where('level_user_id', $levelId)
            ->where('access', true)
            ->pluck('nav_item_id')
            ->map(fn($v) => (int) $v)
            ->toArray();
    }

    /**
     * Build pohon menu terfilter: node disimpan bila:
     *  - node sendiri allowed, atau
     *  - memiliki child yang allowed (agar parent muncul sebagai grup).
     *
     * Output node:
     *  [id,label,slug,icon,parent_id,order_number,children[]]
     */
    private function buildAllowedMenuTree(int $levelId): array
    {
        $allowed = $this->allowedIds($levelId);

        // Ambil semua item aktif
        $items = NavItem::query()
            ->where('is_active', true)
            ->orderBy('parent_id')
            ->orderBy('order_number')
            ->get(['id','label','slug','icon','parent_id','order_number']);

        // Siapkan node map
        $nodes = [];
        foreach ($items as $it) {
            $nodes[$it->id] = [
                'id' => (int) $it->id,
                'label' => $it->label,
                'slug' => $it->slug,
                'icon' => $it->icon,
                'parent_id' => $it->parent_id ? (int) $it->parent_id : null,
                'order_number' => (int) $it->order_number,
                'allowed' => in_array((int) $it->id, $allowed, true),
                'children' => [],
            ];
        }

        // Parent -> children list
        $childrenMap = [];
        foreach ($nodes as $id => $n) {
            $pid = $n['parent_id'] ?? 0;
            $childrenMap[$pid][] = $id;
        }

        // recursive build + filter
        $build = function ($pid) use (&$build, &$nodes, &$childrenMap): array {
            $ids = $childrenMap[$pid ?? 0] ?? [];
            $out = [];
            foreach ($ids as $cid) {
                $node = $nodes[$cid];
                $node['children'] = $build($cid);
                $keep = $node['allowed'] || count($node['children']) > 0;
                if ($keep) {
                    unset($node['allowed']); // jangan expose flag internal
                    $out[] = $node;
                }
            }
            return $out;
        };

        return $build(null);
    }
}
