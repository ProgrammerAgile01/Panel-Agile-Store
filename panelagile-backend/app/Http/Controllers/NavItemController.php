<?php

// app/Http/Controllers/NavItemController.php
namespace App\Http\Controllers;

use App\Models\NavItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class NavItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
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
                n.slug                       as _path,
                n.order_number               as _order_number
            ')
            ->orderByRaw('COALESCE(p.label, n.label) asc')
            ->orderBy('n.order_number')
            ->orderBy('n.label')
            ->get();

        // Jika diminta sembunyikan parent yg punya child → hanya tampilkan child;
        // tapi parent TANPA child tetap tampil (item mandiri).
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

        // Bentuk payload sesuai kebutuhan UI MatrixLevel (NavItem[])
        $data = $rows->map(function ($r) {
            return [
                'id' => (int) $r->id,
                'group' => $r->_group,     // label parent (atau label diri jika mandiri)
                'name' => $r->_name,      // label item
                'path' => $r->_path,      // slug
                'description' => '',             // tidak ada di tabel → kosongkan
                'order_number' => (int) $r->_order_number,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'label' => 'required|string|max:100',
            'slug' => 'required|string|max:100',
            'icon' => 'nullable|string|max:100',
            'parent_id' => 'nullable|exists:nav_items,id',
            'order_number' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $item = NavItem::create($data);
        return response()->json(['message' => 'Created', 'data' => $item], 201);
    }

    public function show(NavItem $nav_item)
    {
        $nav_item->load(['children' => fn($q) => $q->orderBy('order_number')]);
        return response()->json(['data' => $nav_item]);
    }

    public function update(Request $request, NavItem $nav_item)
    {
        $data = $request->validate([
            'label' => 'sometimes|required|string|max:100',
            'slug' => 'sometimes|required|string|max:100',
            'icon' => 'nullable|string|max:100',
            'parent_id' => 'nullable|exists:nav_items,id',
            'order_number' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);
        $nav_item->update($data);
        return response()->json(['message' => 'Updated', 'data' => $nav_item]);
    }

    public function destroy(NavItem $nav_item)
    {
        $nav_item->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
