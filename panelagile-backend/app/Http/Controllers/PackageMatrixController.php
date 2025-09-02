<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Product;
use App\Models\ProductPackage;
use App\Models\ProductFeature;
use App\Models\Menu;

class PackageMatrixController extends Controller
{
    /**
     * GET /api/catalog/products/{codeOrId}/matrix
     * Public READ — mengembalikan paket + fitur + menu + matrix dalam satu payload.
     *
     * Response:
     * {
     *   "data": {
     *     "product": {...},
     *     "packages": [...],
     *     "features": [...], // item_type=FEATURE saja
     *     "menus": [...],    // dari mst_menus (leaf) + module_group & module
     *     "matrix": [ {product_code, package_id, item_type, item_id, enabled}, ... ]
     *   }
     * }
     */
    public function index(Request $request, string $codeOrId)
    {
        $product = Product::where('product_code', $codeOrId)
            ->orWhere('id', $codeOrId)
            ->firstOrFail();

        // PACKAGES (tampilkan semua agar matrix utuh)
        $packages = ProductPackage::query()
            ->where('product_code', $product->product_code)
            ->orderBy('order_number')->orderBy('id')
            ->get([
                'id','product_id','product_code','package_code',
                'name','description','status','notes','order_number',
                'created_at','updated_at','deleted_at',
            ]);

        // FEATURES (item_type = FEATURE saja)
        $features = ProductFeature::query()
            ->where('product_code', $product->product_code)
            ->where('item_type', 'FEATURE')
            ->orderBy('order_number')->orderBy('feature_code')
            ->get([
                'id','product_code','item_type','feature_code',
                'name','description','module_name','menu_parent_code',
                'is_active','order_number','price_addon',
                'trial_available','trial_days',
                'synced_at','created_at','updated_at',
            ]);

        /**
         * MENUS — ambil hanya daun (type='Menu'), lalu self-join ke parent Module (md) dan Group (gp).
         * Hasil: setiap row punya module_group, module, dan full_path "Group › Module › Menu".
         */
        $menus = DB::table('mst_menus as mn')
            // parent 1: MODULE
            ->leftJoin('mst_menus as md', function ($j) {
                $j->on('md.id', '=', 'mn.parent_id')
                  ->whereIn('md.type', ['Module', 'module']);
            })
            // parent 2: GROUP (parent dari MODULE)
            ->leftJoin('mst_menus as gp', function ($j) {
                $j->on('gp.id', '=', 'md.parent_id')
                  ->whereIn('gp.type', ['Group', 'group']);
            })
            ->where('mn.product_code', $product->product_code)
            ->whereIn('mn.type', ['Menu', 'menu']) // hanya leaf
            ->select([
                'mn.id',
                'mn.parent_id',
                'mn.level',
                'mn.type',
                'mn.title',
                'mn.icon',
                'mn.color',
                'mn.order_number',
                'mn.crud_builder_id',
                'mn.product_code',
                'mn.route_path',
                'mn.is_active',
                'mn.note',
                'mn.created_by',
                'mn.created_at',
                'mn.updated_at',
                'mn.deleted_at',

                // ✅ alias untuk FE (kelompok & modul)
                DB::raw('COALESCE(gp.title, "General") as module_group'),
                DB::raw('COALESCE(md.title, "General") as module'),

                // ✅ untuk pengurutan stabil
                DB::raw('COALESCE(gp.order_number, 0) as group_order'),
                DB::raw('COALESCE(md.order_number, 0) as module_order'),
                DB::raw('COALESCE(mn.order_number, 0) as menu_order'),
            ])
            ->orderBy('group_order')
            ->orderBy('module_order')
            ->orderBy('menu_order')
            ->orderBy('mn.id')
            ->get()
            ->map(function ($m) {
                // Tambahkan full_path "Group › Module › Menu" (opsional, bantu debug/print)
                $g = $m->module_group ?: 'General';
                $d = $m->module ?: 'General';
                $t = $m->title ?: '';
                $m->full_path = "{$g} › {$d} › {$t}";
                return $m;
            });

        // MATRIX
        $matrix = DB::table('mst_package_matrix')
            ->where('product_code', $product->product_code)
            ->select(['product_code','package_id','item_type','item_id','enabled'])
            ->get();

        return response()->json([
            'data' => [
                'product'  => $product,
                'packages' => $packages,
                'features' => $features,
                'menus'    => $menus,   // ← sudah berisi module_group & module
                'matrix'   => $matrix,
            ],
        ]);
    }

    /**
     * POST /api/catalog/products/{codeOrId}/matrix/bulk  (JWT)
     * Body: { "changes": [ {item_type:"feature|menu", item_id:"...", package_id:123, enabled:true}, ... ] }
     */
    public function bulkUpsert(Request $request, string $codeOrId)
    {
        $validated = $request->validate([
            'changes'                  => ['required', 'array', 'min:1'],
            'changes.*.item_type'      => ['required', 'in:feature,menu'],
            'changes.*.item_id'        => ['required', 'string'],
            'changes.*.package_id'     => ['required', 'integer'],
            'changes.*.enabled'        => ['required', 'boolean'],
        ]);

        $product = Product::where('product_code', $codeOrId)
            ->orWhere('id', $codeOrId)
            ->firstOrFail();

        // Validasi package milik produk
        $pkgIds = collect($validated['changes'])->pluck('package_id')->unique()->values()->all();
        $validPkgIds = ProductPackage::where('product_code', $product->product_code)
            ->whereIn('id', $pkgIds)
            ->pluck('id')->all();

        $invalid = array_diff($pkgIds, $validPkgIds);
        if (!empty($invalid)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid package_id for this product: ' . implode(',', $invalid),
            ], 422);
        }

        $now = now()->toDateTimeString();
        $rows = [];
        foreach ($validated['changes'] as $c) {
            $rows[] = [
                'product_code' => $product->product_code,
                'package_id'   => (int)$c['package_id'],
                'item_type'    => (string)$c['item_type'], // feature|menu
                'item_id'      => (string)$c['item_id'],
                'enabled'      => (bool)$c['enabled'],
                'created_at'   => $now,
                'updated_at'   => $now,
            ];
        }

        // Pastikan unique index: (product_code, package_id, item_type, item_id)
        DB::table('mst_package_matrix')->upsert(
            $rows,
            ['product_code', 'package_id', 'item_type', 'item_id'],
            ['enabled', 'updated_at']
        );

        return response()->json(['success' => true, 'count' => count($rows)]);
    }

    /**
     * PATCH /api/catalog/products/{codeOrId}/matrix/toggle  (JWT)
     * Body: { item_type:"feature|menu", item_id:"...", package_id:123, enabled:true }
     */
    public function toggle(Request $request, string $codeOrId)
    {
        $validated = $request->validate([
            'item_type'  => ['required', 'in:feature,menu'],
            'item_id'    => ['required', 'string'],
            'package_id' => ['required', 'integer'],
            'enabled'    => ['required', 'boolean'],
        ]);

        $product = Product::where('product_code', $codeOrId)
            ->orWhere('id', $codeOrId)
            ->firstOrFail();

        $pkg = ProductPackage::where('product_code', $product->product_code)
            ->where('id', (int)$validated['package_id'])
            ->firstOrFail();

        $now = now()->toDateTimeString();

        DB::table('mst_package_matrix')->upsert(
            [[
                'product_code' => $product->product_code,
                'package_id'   => $pkg->id,
                'item_type'    => (string)$validated['item_type'], // feature|menu
                'item_id'      => (string)$validated['item_id'],
                'enabled'      => (bool)$validated['enabled'],
                'created_at'   => $now,
                'updated_at'   => $now,
            ]],
            ['product_code', 'package_id', 'item_type', 'item_id'],
            ['enabled', 'updated_at']
        );

        return response()->json(['success' => true]);
    }
}
