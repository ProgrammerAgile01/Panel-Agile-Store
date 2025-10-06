<?php

// namespace App\Http\Controllers\Store;

// use App\Http\Controllers\Controller;
// use Illuminate\Http\Request;
// use Illuminate\Support\Facades\DB;

// class OfferingMatrixController extends Controller
// {
//     /**
//      * (Opsional) List offering (alias package) pada sebuah product.
//      * Sumber bisa dari tabel paket kamu: mst_packages (silakan sesuaikan).
//      */
//     public function list(Request $req, string $product)
//     {
//         // Contoh asumsi tabel paket utama = mst_packages
//         // Kolom: id, product_code, slug, name, is_active
//         $rows = DB::table('mst_product_packages')
//             ->where('product_code', $product)
//             ->where('is_active', 1)
//             ->orderBy('name')
//             ->get([
//                 'id','product_code','name','is_active'
//             ]);

//         return response()->json([
//             'ok'   => true,
//             'data' => $rows,
//         ]);
//     }

//     /**
//      * Matrix menu/feature yang di-enable untuk {product}/{offering}.
//      * offering = slug (atau id), silakan cocokkan logic look-up sesuai tabel kamu.
//      */
//     public function matrix(Request $req, string $product, string $offering)
//     {
//         // 1) Resolve offering -> package_id
//         $pkg = DB::table('mst_product_packages')
//             ->where('product_code', $product)
//             ->where(function($q) use ($offering) {
//                 // dukung by id atau slug
//                 if (ctype_digit($offering)) {
//                     $q->where('id', (int)$offering);
//                 } else {
//                     // $q->where('slug', $offering);
//                 }
//             })
//             ->first(['id','product_code','name']);

//         if (!$pkg) {
//             return response()->json([
//                 'ok'     => false,
//                 'error'  => 'Offering not found',
//             ], 404);
//         }

//         // 2) Ambil matrix dari tabel yang sudah kamu buat: mst_package_matrix
//         $matrix = DB::table('mst_package_matrix')
//             ->where('product_code', $product)
//             ->where('package_id', $pkg->id)
//             ->get(['item_type','item_id','enabled']);

//         // 3) Pecah id menu & feature yang enabled
//         $menuIds    = [];
//         $featureIds = [];
//         foreach ($matrix as $m) {
//             if (!$m->enabled) continue;
//             if ($m->item_type === 'menu')    $menuIds[]    = (int)$m->item_id;
//             if ($m->item_type === 'feature') $featureIds[] = (int)$m->item_id;
//         }

//         // 4) Ambil detail MENUS & FEATURES untuk UI/FE
//         $menus = [];
//         if ($menuIds) {
//             $menus = DB::table('mst_menus')
//                 ->whereIn('id', $menuIds)
//                 ->orderBy('parent_id')
//                 ->orderBy('order_number')
//                 ->get([
//                     'id','parent_id','level','type','title','icon','color',
//                     'order_number','product_code','route_path','is_active'
//                 ]);
//         }

//         $features = [];
//         if ($featureIds) {
//             $features = DB::table('mst_product_features')
//                 ->whereIn('id', $featureIds)
//                 ->orderBy('order_number')
//                 ->get([
//                     'id','product_code','feature_code','name','description',
//                     'module_name','item_type','menu_parent_code','is_active',
//                     'order_number','price_addon','trial_available','trial_days'
//                 ]);
//         }

//         // 5) Kembalikan payload yang rapi untuk Warehouse/Produk
//         return response()->json([
//             'ok'   => true,
//             'data' => [
//                 'offering' => [
//                     'id'           => $pkg->id,
//                     // 'slug'         => $pkg->slug,
//                     'name'         => $pkg->name,
//                     'product_code' => $pkg->product_code,
//                 ],
//                 'menus'    => $menus,
//                 'features' => $features,
//             ],
//         ]);
//     }
// }

// app/Http/Controllers/Store/OfferingMatrixController.php


namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OfferingMatrixController extends Controller
{
    public function list(Request $req, string $product)
    {
        // sesuaikan ke tabel yang kamu pakai
        $rows = DB::table('mst_product_packages')
            ->where('product_code', $product)
            ->where('status', 'active') // atau is_active=1 sesuai kolommu
            ->orderBy('order_number', 'asc')
            ->get([
                'id',
                'product_code',
                DB::raw('package_code as slug'),
                DB::raw('name as name'),
                DB::raw('1 as is_active'),
            ]);

        return response()->json(['ok' => true, 'data' => $rows]);
    }

    public function matrix(Request $req, string $product, string $offering)
    {
        // === 1) Resolve offering -> package_id (coba beberapa sumber) ===
        $pkg = DB::table('mst_product_packages')
            ->where('product_code', $product)
            ->when(ctype_digit($offering), fn($q) => $q->where('id', (int)$offering),
                   fn($q) => $q->where('package_code', $offering))
            ->first(['id','product_code','name']);

        if (!$pkg) {
            // fallback ke tabel yang memang kamu gunakan: mst_product_packages
            $pkg = DB::table('mst_product_packages')
                ->where('product_code', $product)
                ->when(ctype_digit($offering), fn($q) => $q->where('id', (int)$offering),
                       fn($q) => $q->where('package_code', $offering))
                ->first([
                    'id',
                    'product_code',
                    DB::raw('package_code as slug'),
                    'name'
                ]);
        }

        if (!$pkg) {
            return response()->json(['ok' => false, 'error' => 'Offering not found'], 404);
        }

        // === 2) Ambil matrix dari mst_package_matrix ===
        $matrix = DB::table('mst_package_matrix')
            ->where('product_code', $product)
            ->where('package_id', $pkg->id)
            ->get(['item_type','item_id','enabled']);

        $menuIds = [];
        $featureIds = [];
        foreach ($matrix as $m) {
            if (!$m->enabled) continue;
            if ($m->item_type === 'menu')    $menuIds[]    = (int) $m->item_id;
            if ($m->item_type === 'feature') $featureIds[] = (int) $m->item_id;
        }

        // === 3) Detail menus & features ===
        $menus = $menuIds
            ? DB::table('mst_menus')
                ->whereIn('id', $menuIds)
                ->orderBy('parent_id')->orderBy('order_number')
                ->get([
                    'id','parent_id','level','type','title','icon','color',
                    'order_number','product_code','route_path','is_active'
                ])
            : collect();

        $features = $featureIds
            ? DB::table('mst_product_features')
                ->whereIn('id', $featureIds)
                ->orderBy('order_number')
                ->get([
                    'id','product_code','feature_code','name','description',
                    'module_name','item_type','menu_parent_code','is_active',
                    'order_number','price_addon','trial_available','trial_days'
                ])
            : collect();

        return response()->json([
            'ok'   => true,
            'data' => [
                'offering' => [
                    'id'           => $pkg->id,
                    // 'slug'         => $pkg->slug,        // untuk premium => "premium"
                    'name'         => $pkg->name,        // "Premium"
                    'product_code' => $pkg->product_code // "TIRTABENING"
                ],
                'menus'    => $menus,
                'features' => $features,
            ],
        ]);
    }
}
