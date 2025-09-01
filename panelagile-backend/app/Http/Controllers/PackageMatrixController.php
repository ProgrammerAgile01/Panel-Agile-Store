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
     *     "menus": [...],    // dari mst_menus
     *     "matrix": [ {product_code, package_id, item_type, item_id, enabled}, ... ]
     *   }
     * }
     */
    public function index(Request $request, string $codeOrId)
    {
        $product = Product::where('product_code', $codeOrId)
            ->orWhere('id', $codeOrId)
            ->firstOrFail();

        // Packages (tampilkan semua agar matrix utuh)
        $packages = ProductPackage::query()
            ->where('product_code', $product->product_code)
            ->orderBy('order_number')->orderBy('id')
            ->get([
                'id','product_id','product_code','package_code',
                'name','description','status','notes','order_number',
                'created_at','updated_at','deleted_at',
            ]);

        // FEATURES (mirror)
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

        // MENUS — hanya daun (type = 'Menu')
        $menusRaw = Menu::query()
            ->where('product_code', $product->product_code)
            ->where('type', 'Menu')               // <— penting: hanya leaf
            ->orderBy('order_number')->orderBy('id')
            ->get([
                'id','parent_id','level','type','title','icon','color',
                'order_number','crud_builder_id','product_code','route_path',
                'is_active','note','created_by','created_at','updated_at','deleted_at',
            ]);

        // Optional: build breadcrumb path (Group › Module › Menu)
        $byId = $menusRaw->keyBy('id');
        $makePath = function ($m) use (&$byId, &$makePath) {
            $parts = [$m->title];
            $p = $m->parent_id ? $byId->get($m->parent_id) : null;
            while ($p) {
                $parts[] = $p->title;
                $p = $p->parent_id ? $byId->get($p->parent_id) : null;
            }
            return implode(' › ', array_reverse($parts));
        };

        $menus = $menusRaw->map(function ($m) use ($makePath) {
            $m->full_path = $makePath($m);  // contoh: "Master Data › Pegawai › Data Pegawai"
            return $m;
        })->values();

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
                'menus'    => $menus,   // pastikan kolom 'title' + 'full_path' ada
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
