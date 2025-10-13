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


// namespace App\Http\Controllers\Store;

// use App\Http\Controllers\Controller;
// use Illuminate\Http\Request;
// use Illuminate\Support\Facades\DB;

// class OfferingMatrixController extends Controller
// {
//     public function list(Request $req, string $product)
//     {
//         // sesuaikan ke tabel yang kamu pakai
//         $rows = DB::table('mst_product_packages')
//             ->where('product_code', $product)
//             ->where('status', 'active') // atau is_active=1 sesuai kolommu
//             ->orderBy('order_number', 'asc')
//             ->get([
//                 'id',
//                 'product_code',
//                 DB::raw('package_code as slug'),
//                 DB::raw('name as name'),
//                 DB::raw('1 as is_active'),
//             ]);

//         return response()->json(['ok' => true, 'data' => $rows]);
//     }

//     public function matrix(Request $req, string $product, string $offering)
//     {
//         // === 1) Resolve offering -> package_id (coba beberapa sumber) ===
//         $pkg = DB::table('mst_product_packages')
//             ->where('product_code', $product)
//             ->when(ctype_digit($offering), fn($q) => $q->where('id', (int)$offering),
//                    fn($q) => $q->where('package_code', $offering))
//             ->first(['id','product_code','name']);

//         if (!$pkg) {
//             // fallback ke tabel yang memang kamu gunakan: mst_product_packages
//             $pkg = DB::table('mst_product_packages')
//                 ->where('product_code', $product)
//                 ->when(ctype_digit($offering), fn($q) => $q->where('id', (int)$offering),
//                        fn($q) => $q->where('package_code', $offering))
//                 ->first([
//                     'id',
//                     'product_code',
//                     DB::raw('package_code as slug'),
//                     'name'
//                 ]);
//         }

//         if (!$pkg) {
//             return response()->json(['ok' => false, 'error' => 'Offering not found'], 404);
//         }

//         // === 2) Ambil matrix dari mst_package_matrix ===
//         $matrix = DB::table('mst_package_matrix')
//             ->where('product_code', $product)
//             ->where('package_id', $pkg->id)
//             ->get(['item_type','item_id','enabled']);

//         $menuIds = [];
//         $featureIds = [];
//         foreach ($matrix as $m) {
//             if (!$m->enabled) continue;
//             if ($m->item_type === 'menu')    $menuIds[]    = (int) $m->item_id;
//             if ($m->item_type === 'feature') $featureIds[] = (int) $m->item_id;
//         }

//         // === 3) Detail menus & features ===
//         $menus = $menuIds
//             ? DB::table('mst_menus')
//                 ->whereIn('id', $menuIds)
//                 ->orderBy('parent_id')->orderBy('order_number')
//                 ->get([
//                     'id','parent_id','level','type','title','icon','color',
//                     'order_number','product_code','route_path','is_active'
//                 ])
//             : collect();

//         $features = $featureIds
//             ? DB::table('mst_product_features')
//                 ->whereIn('id', $featureIds)
//                 ->orderBy('order_number')
//                 ->get([
//                     'id','product_code','feature_code','name','description',
//                     'module_name','item_type','menu_parent_code','is_active',
//                     'order_number','price_addon','trial_available','trial_days'
//                 ])
//             : collect();

//         return response()->json([
//             'ok'   => true,
//             'data' => [
//                 'offering' => [
//                     'id'           => $pkg->id,
//                     // 'slug'         => $pkg->slug,        // untuk premium => "premium"
//                     'name'         => $pkg->name,        // "Premium"
//                     'product_code' => $pkg->product_code // "TIRTABENING"
//                 ],
//                 'menus'    => $menus,
//                 'features' => $features,
//             ],
//         ]);
//     }
// }

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OfferingMatrixController extends Controller
{
    public function list(Request $req, string $product)
    {
        // Pastikan cuma paket aktif & berurutan
        $rows = DB::table('mst_product_packages')
            ->where('product_code', $product)
            ->where(function ($q) {
                // Sesuaikan kolom status di DB kamu
                if (Schema::hasColumn('mst_product_packages', 'status')) {
                    $q->where('status', 'active');
                } else {
                    $q->where('is_active', 1);
                }
            })
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
    // === 1) Resolve offering -> package ===
    $pkg = DB::table('mst_product_packages')
        ->where('product_code', $product)
        ->when(ctype_digit($offering),
            fn ($q) => $q->where('id', (int) $offering),
            fn ($q) => $q->where('package_code', $offering)
        )
        ->first(['id', 'product_code', 'package_code', 'name']);

    if (!$pkg) {
        return response()->json(['ok' => false, 'error' => 'Offering not found'], 404);
    }

    // === 2) MENUS via JOIN (tetap seperti sebelumnya; aman & hanya milik paket ini) ===
    $menus = DB::table('mst_menus as mn')
        ->join('mst_package_matrix as mx', function ($j) use ($product, $pkg) {
            $j->on('mx.item_id', '=', 'mn.id')
              ->whereRaw('LOWER(mx.item_type) = ?', ['menu'])
              ->where('mx.product_code', $product)
              ->where('mx.package_id', $pkg->id)
              ->where('mx.enabled', 1);
        })
        ->where('mn.product_code', $product)
        ->when(DB::getSchemaBuilder()->hasColumn('mst_menus', 'is_active'),
            fn ($q) => $q->where('mn.is_active', 1)
        )
        ->orderBy('mn.parent_id')
        ->orderBy('mn.order_number')
        ->get([
            'mn.id','mn.parent_id','mn.level','mn.type','mn.title','mn.icon','mn.color',
            'mn.order_number','mn.product_code','mn.route_path',
            DB::raw('COALESCE(mn.is_active,1) as is_active'),
        ]);

    // === 3) FEATURES: tarik semua baris matrix feature utk paket ini ===
    $mxFeatures = DB::table('mst_package_matrix')
        ->where('product_code', $product)
        ->where('package_id', $pkg->id)
        ->whereRaw('LOWER(item_type) = ?', ['feature'])
        ->where('enabled', 1)
        ->pluck('item_id')
        ->all();

    $featureIds   = [];
    $featureCodes = [];
    foreach ($mxFeatures as $val) {
        if (is_numeric($val)) {
            $featureIds[] = (int) $val;
        } else {
            $code = trim((string)$val);
            if ($code !== '') $featureCodes[] = $code;
        }
    }

    // Ambil detail fitur yang tersedia di tabel master
    $found = collect();
    if (!empty($featureIds) || !empty($featureCodes)) {
        $found = DB::table('mst_product_features as f')
            ->where('f.product_code', $product)
            ->where(function ($q) use ($featureIds, $featureCodes) {
                if (!empty($featureIds))   $q->orWhereIn('f.id', $featureIds);
                if (!empty($featureCodes)) $q->orWhereIn('f.feature_code', $featureCodes);
            })
            ->when(DB::getSchemaBuilder()->hasColumn('mst_product_features', 'is_active'),
                fn ($q) => $q->where('f.is_active', 1)
            )
            ->orderBy('f.order_number')
            ->get([
                'f.id','f.product_code','f.feature_code','f.name','f.description',
                'f.module_name','f.item_type','f.menu_parent_code',
                DB::raw('COALESCE(f.is_active,1) as is_active'),
                'f.order_number','f.price_addon','f.trial_available','f.trial_days',
            ]);
    }

    // Buat map code -> row dari tabel master
    $foundByCode = [];
    foreach ($found as $row) {
        $foundByCode[strtolower($row->feature_code)] = $row;
    }

    // Bangun final features:
    // - pakai data master jika ada
    // - kalau tidak ada (kode seperti maksimal.*), buat stub supaya FE tetap bisa gate
    $finalFeatures = [];
    $allCodes = array_unique(array_merge(
        $featureCodes,
        // tambahkan kode dari id numerik yang berhasil ditemukan di tabel master
        array_map(fn($r) => $r->feature_code, $found->all())
    ));

    foreach ($allCodes as $code) {
        $key = strtolower($code);
        if (isset($foundByCode[$key])) {
            $r = $foundByCode[$key];
            $finalFeatures[] = [
                'id'              => $r->id,
                'product_code'    => $r->product_code,
                'feature_code'    => $r->feature_code,
                'name'            => $r->name,
                'description'     => $r->description,
                'module_name'     => $r->module_name,
                'item_type'       => $r->item_type,
                'menu_parent_code'=> $r->menu_parent_code,
                'is_active'       => $r->is_active,
                'order_number'    => $r->order_number,
                'price_addon'     => $r->price_addon,
                'trial_available' => $r->trial_available,
                'trial_days'      => $r->trial_days,
            ];
        } else {
            // stub (untuk kode yang tidak ada di master features)
            $finalFeatures[] = [
                'id'              => null,
                'product_code'    => $product,
                'feature_code'    => $code,
                'name'            => $code,      // bisa kamu mapping ke label cantik nanti
                'description'     => null,
                'module_name'     => null,
                'item_type'       => 'FEATURE',
                'menu_parent_code'=> null,
                'is_active'       => 1,
                'order_number'    => 9999,
                'price_addon'     => 0,
                'trial_available' => 0,
                'trial_days'      => 0,
            ];
        }
    }

    return response()->json([
        'ok'   => true,
        'data' => [
            'offering' => [
                'id'           => $pkg->id,
                'slug'         => $pkg->package_code,
                'name'         => $pkg->name,
                'product_code' => $pkg->product_code,
            ],
            'menus'    => $menus,
            'features' => $finalFeatures, // ← sekarang terisi sesuai matrix paket (termasuk kode limit/stub)
        ],
    ]);
}

}
