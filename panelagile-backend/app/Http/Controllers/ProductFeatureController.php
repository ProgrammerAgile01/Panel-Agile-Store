<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductFeature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\Menu;
use App\Services\WarehouseClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProductFeatureController extends Controller
{
    /** ============================
     *  PUBLIC (tanpa JWT) — READ
     *  ============================
     */

    /** GET /api/catalog/products/{code}/features?refresh=1 */
   // App\Http\Controllers\ProductFeatureController.php

public function listFeatures(Request $req, string $codeOrId)
{
    $product = $this->resolveProduct($codeOrId);
    if (!$product) {
        return response()->json(['message' => 'Product not found'], 404);
    }

    // 1) Refresh manual dari FE (tombol/param)
    if ($req->boolean('refresh')) {
        $this->mirrorFromWarehouse($product->product_code);
    }

    // 2) Kalau lokal kosong → auto sync sekali
    $exists = \App\Models\ProductFeature::where('product_code', $product->product_code)->exists();
    if (!$exists) {
        $this->mirrorFromWarehouse($product->product_code);
    }

    // 3) Selalu baca dari DB lokal
    $rows = \App\Models\ProductFeature::where('product_code', $product->product_code)
        ->orderByRaw('COALESCE(order_number, 999999)')
        ->orderBy('name')
        ->get();

    $data = $rows->map(function (\App\Models\ProductFeature $r) {
        return [
            'id'               => (string)$r->id,
            'feature_code'     => (string)$r->feature_code,
            'name'             => (string)$r->name,
            'description'      => (string)($r->description ?? ''),
            'module_name'      => (string)($r->module_name ?? 'General'),
            'item_type'        => (string)$r->item_type,   // FEATURE / SUBFEATURE
            'parent_id'        => null,
            'parent_code'      => null,
            'menu_parent_code' => (string)($r->menu_parent_code ?? ''),
            'is_active'        => (bool)$r->is_active,
            'order_number'     => (int)($r->order_number ?? 0),
            'price_addon'      => (float)($r->price_addon ?? 0),
            'trial_available'  => (bool)($r->trial_available ?? false),
            'trial_days'       => $r->trial_days !== null ? (int)$r->trial_days : null,
            'created_at'       => optional($r->created_at)->toISOString(),
            'updated_at'       => optional($r->updated_at)->toISOString(),
            'product_code'     => (string)$r->product_code,
        ];
    })->all();

    return response()->json(['data' => $data]);
}

   

    /** POST /api/catalog/products/{code}/features/sync */
    // public function syncFeatures(string $codeOrId)
    // {
    //     $product = $this->resolveProduct($codeOrId);
    //     if (!$product) {
    //         return response()->json(['message' => 'Product not found'], 404);
    //     }

    //     $counts = $this->mirrorFromWarehouse($product->product_code);
    //     return response()->json(['message' => 'Sync complete', 'counts' => $counts]);
    // }

    /** =========================================
     *  PROTECTED (JWT) — UPDATE HANYA PARENT PRICE
     *  =========================================
     *  PATCH /api/catalog/products/{code}/features/{feature}/price
     *  Body: { "price_addon": 12345.67 }
     */
   public function updatePrice(Request $req, string $codeOrId, string $feature)
{
    $product = $this->resolveProduct($codeOrId);
    if (!$product) return response()->json(['message'=>'Product not found'],404);

    $data = $req->validate(['price_addon' => ['required','numeric','min:0']]);

    $row = ProductFeature::where('product_code', $product->product_code)
        ->where(fn($q)=>$q->where('id',$feature)->orWhere('feature_code',$feature))
        ->first();

    if (!$row) return response()->json(['message'=>'Feature not found'],404);
    if (strtoupper((string)$row->item_type) !== 'FEATURE') {
        return response()->json(['message'=>'Only parent FEATURE is allowed to edit price.'], 422);
    }

    // kolom DECIMAL(12,2) oke, model cast float
    $row->price_addon = (float) $data['price_addon'];
    $row->save();

    return response()->json([
        'message' => 'Price updated',
        'data' => [
            'id'           => (string)$row->id,
            'feature_code' => (string)$row->feature_code,
            'item_type'    => (string)$row->item_type,
            'price_addon'  => (float)$row->price_addon,
            'product_code' => (string)$row->product_code,
            'updated_at'   => optional($row->updated_at)->toISOString(),
        ],
    ]);
}

    /** Cari feature by id ATAU feature_code untuk product tertentu. */
    protected function findFeatureForProduct(string $productCode, string $idOrCode): ?ProductFeature
    {
        return ProductFeature::where('product_code', $productCode)
            ->where(function ($q) use ($idOrCode) {
                $q->where('id', $idOrCode)
                  ->orWhere('feature_code', $idOrCode);
            })
            ->first();
    }


    /** ================= Helpers ================= */

    protected function resolveProduct(string $codeOrId): ?Product
    {
        return Product::where('product_code', $codeOrId)
            ->orWhere('id', $codeOrId)
            ->first();
    }

    /**
     * Tarik fitur dari Warehouse (HTTP) → mirror ke mst_product_features
     * Catatan:
     * - Wajibkan feature_code & name (fallback ke slug/uuid jika kosong).
     * - Subfeature diikat ke parent via mapping id→feature_code
//      */
//   protected function mirrorFromWarehouse(string $productCode): array
// {
//     $base = rtrim((string) config('services.warehouse.base'), '/');
//     $key  = (string) config('services.warehouse.key');
//     $headers = ['X-CLIENT-KEY'=>$key,'Accept'=>'application/json'];

//     $fres = Http::withHeaders($headers)
//         ->get($base."/catalog/products/{$productCode}/features");
//     if ($fres->failed()) {
//         $msg = $fres->json('message') ?? ($fres->status().' '.$fres->reason());
//         throw new \RuntimeException("Failed to fetch features from warehouse: ".$msg);
//     }

//     $features = $fres->json('data') ?? [];
//     if (!is_array($features)) $features = [];

//     // parent_id -> feature_code map
//     $idToCode = [];
//     foreach ($features as $f) {
//         $fid  = (string)($f['id'] ?? '');
//         $fcode= (string)($f['feature_code'] ?? $f['code'] ?? '');
//         if ($fid !== '' && $fcode !== '') $idToCode[$fid] = $fcode;
//     }

//     $countF = 0; $countS = 0; $now = now();

//     foreach ($features as $f) {
//         $typeRaw  = strtoupper((string)($f['item_type'] ?? $f['type'] ?? 'FEATURE'));
//         $itemType = in_array($typeRaw, ['FEATURE','SUBFEATURE'], true) ? $typeRaw : 'FEATURE';

//         $nameRaw  = trim((string)($f['name'] ?? $f['feature_name'] ?? $f['title'] ?? $f['slug'] ?? ''));
//         $codeRaw  = trim((string)($f['feature_code'] ?? $f['code'] ?? ''));
//         if ($codeRaw === '') {
//             $codeRaw = $nameRaw !== '' ? Str::slug($nameRaw, '.') : ('feat.'.Str::uuid()->toString());
//         }
//         $name = $nameRaw !== '' ? $nameRaw : $codeRaw;

//         $parentCode = null;
//         if ($itemType === 'SUBFEATURE') {
//             $pid = $f['parent_id'] ?? null;
//             if ($pid !== null && isset($idToCode[(string)$pid])) $parentCode = $idToCode[(string)$pid];
//         }

//         // ==== Kunci unik: product_code + feature_code + item_type ====
//         $pf = ProductFeature::firstOrNew([
//             'product_code' => $productCode,
//             'feature_code' => $codeRaw,
//             'item_type'    => $itemType,
//         ]);

//         // sync field umum
//         $pf->id               = (string)($pf->exists ? $pf->id : ($f['id'] ?? $productCode.'|'.$codeRaw.'|'.$itemType));
//         $pf->name             = $name;
//         $pf->description      = (string)($f['description'] ?? '');
//         $pf->module_name      = (string)($f['module_name'] ?? $f['module'] ?? $f['category'] ?? 'General');
//         $pf->menu_parent_code = $parentCode;
//         $pf->is_active        = !(
//             (isset($f['is_active']) && $f['is_active'] === false) ||
//             (isset($f['status']) && in_array(strtolower((string)$f['status']), ['inactive','disabled'], true))
//         );
//         $pf->order_number     = (int)($f['order_number'] ?? 0);

//         // ==== ini kuncinya ====
//         if (!$pf->exists) {
//             // record baru → boleh seed dari warehouse (parent saja)
//             $pf->price_addon = $itemType === 'FEATURE'
//                 ? (float)($f['price_addon'] ?? 0)
//                 : 0.0;
//             $pf->created_at = $now;
//         } else {
//             // record existing → JANGAN ubah price_addon (biarkan hasil edit panel)
//             if ($itemType === 'SUBFEATURE' && (float)$pf->price_addon !== 0.0) {
//                 $pf->price_addon = 0.0; // jaga agar subfeature tetap 0
//             }
//         }

//         $pf->trial_available  = (bool)($f['trial_available'] ?? false);
//         $pf->trial_days       = isset($f['trial_days']) ? (int)$f['trial_days'] : null;
//         $pf->synced_at        = $now;
//         $pf->updated_at       = $now;
//         $pf->save();

//         if ($itemType === 'FEATURE') $countF++; else $countS++;
//     }

//     return ['features'=>$countF,'subfeatures'=>$countS];
// }

// App\Http\Controllers\ProductFeatureController.php



public function syncFeatures(string $codeOrId): JsonResponse
{
    $product = Product::where('product_code', $codeOrId)
        ->orWhere('id', $codeOrId)->first();

    if (!$product) {
        return response()->json(['message' => 'Product not found'], 404);
    }

    try {
        $counts = $this->mirrorFromWarehouse($product->product_code);
        return response()->json(['message' => 'Sync complete', 'counts' => $counts], 200);
    } catch (\Throwable $e) {
        Log::error('[PF Sync] error', ['product'=>$product->product_code, 'ex'=>$e]);
        return response()->json(['message'=>'Internal error syncing features'], 500);
    }
}

/**
 * Tarik fitur dari Warehouse (via WarehouseClient) → mirror ke mst_product_features
 * - Prefix PK id mirror: "<PRODUCT_CODE>:<srcId>" agar unik lintas produk
 * - Ikat subfeature ke parent via mapping id→feature_code → simpan di menu_parent_code
 * - Parent price hanya diset saat seed pertama; tidak ditimpa jika record sudah ada
 */
protected function mirrorFromWarehouse(string $productCode): array
{
    /** @var \App\Services\WarehouseClient $wh */
    $wh = app(\App\Services\WarehouseClient::class);

    // Ambil dari gateway/warehouse (ini yang di tinker sudah OK)
    $payload  = $wh->featuresByProduct($productCode);
    $rows     = $payload['data'] ?? (is_array($payload) ? $payload : []);
    if (!is_array($rows)) { $rows = []; }

    // Siapkan peta parent: upstream id -> feature_code
    $idToCode = [];
    foreach ($rows as $r) {
        $rid   = (string)($r['id'] ?? '');
        $fcode = (string)($r['feature_code'] ?? $r['code'] ?? '');
        if ($rid !== '' && $fcode !== '') $idToCode[$rid] = $fcode;
    }

    $nF = 0; $nS = 0; $now = now();

    foreach ($rows as $r) {
        $srcId = (string)($r['id'] ?? '');
        // pastikan punya kunci upstream
        if ($srcId === '' && empty($r['feature_code']) && empty($r['code'])) {
            Log::warning('[PF Sync] skip row tanpa id/feature_code', ['row'=>$r]);
            continue;
        }

        // Normalisasi dasar
        $typeRaw  = strtoupper((string)($r['item_type'] ?? $r['type'] ?? 'FEATURE'));
        $itemType = in_array($typeRaw, ['FEATURE','SUBFEATURE'], true) ? $typeRaw : 'FEATURE';

        $nameRaw  = trim((string)($r['name'] ?? $r['feature_name'] ?? $r['title'] ?? $r['slug'] ?? ''));
        $codeRaw  = trim((string)($r['feature_code'] ?? $r['code'] ?? ''));
        if ($codeRaw === '') {
            $codeRaw = $nameRaw !== '' ? Str::slug($nameRaw, '.') : ('feat.'.Str::uuid()->toString());
        }
        $name = $nameRaw !== '' ? $nameRaw : $codeRaw;

        // ID mirror diprefix supaya tidak tabrakan lintas produk
        $mirrorId = $productCode . ':' . ($srcId !== '' ? $srcId : $codeRaw);

        // Tentukan parent (pakai feature_code parent)
        $parentCode = null;
        if ($itemType === 'SUBFEATURE') {
            $pid = $r['parent_id'] ?? null;
            if ($pid !== null && isset($idToCode[(string)$pid])) $parentCode = $idToCode[(string)$pid];
        }

        // kunci unik logis (untuk mempertahankan harga hasil edit):
        // product_code + feature_code + item_type
        $pf = ProductFeature::firstOrNew([
            'product_code' => $productCode,
            'feature_code' => $codeRaw,
            'item_type'    => $itemType,
        ]);

        // Set PK fisik string (jika baru)
        if (!$pf->exists) {
            $pf->id = $mirrorId;
        }

        // module_name fallback
        $module = (string)($r['module_name'] ?? $r['module'] ?? $r['category'] ?? '');
        if (trim($module) === '') $module = 'General';

        // Isi kolom mirror
        $pf->name             = $name;
        $pf->description      = (string)($r['description'] ?? '');
        $pf->module_name      = $module;
        $pf->menu_parent_code = $parentCode;
        $pf->is_active        = !(
            (isset($r['is_active']) && $r['is_active'] === false) ||
            (isset($r['status']) && in_array(strtolower((string)$r['status']), ['inactive','disabled'], true))
        );
        $pf->order_number     = (int)($r['order_number'] ?? $r['sort'] ?? 0);

        // Harga: seed sekali untuk FEATURE, jangan overwrite kalau sudah ada
        if (!$pf->exists) {
            $pf->price_addon = $itemType === 'FEATURE'
                ? (float)($r['price_addon'] ?? $r['priceAddon'] ?? 0)
                : 0.0;
            $pf->created_at  = $now;
        } else if ($itemType === 'SUBFEATURE' && (float)$pf->price_addon !== 0.0) {
            $pf->price_addon = 0.0; // jaga subfeature selalu 0
        }

        $pf->trial_available  = (bool)($r['trial_available'] ?? false);
        $pf->trial_days       = array_key_exists('trial_days', $r)
                                ? (is_null($r['trial_days']) ? null : (int)$r['trial_days'])
                                : null;
        $pf->synced_at        = $now;
        $pf->updated_at       = $now;

        $pf->save();

        if ($itemType === 'FEATURE') $nF++; else $nS++;
    }

    return ['features'=>$nF,'subfeatures'=>$nS];
}

  public function listMenus(Request $req, string $codeOrId): JsonResponse
    {
        if ($req->boolean('refresh')) {
            $sync = $this->syncMenus($req, $codeOrId, true);
            if ($sync->getStatusCode() >= 300) return $sync; // gagal sync -> propagate error
        }

        // Kalau belum ada mirror lokal, auto-sync 1x
        $exists = Menu::forProduct($codeOrId)->count();
        if ($exists === 0) {
            $sync = $this->syncMenus($req, $codeOrId, true);
            if ($sync->getStatusCode() >= 300) return $sync;
        }

        $rows = Menu::forProduct($codeOrId)
            ->orderBy('order_number')
            ->get([
                'id','parent_id','title','icon','route_path','order_number','is_active','product_code','type','level','color'
            ])
            ->map(function ($m) {
                return [
                    'id'           => (int) $m->id,
                    'parent_id'    => $m->parent_id ? (int) $m->parent_id : null,
                    'title'        => (string) $m->title,
                    'icon'         => (string) ($m->icon ?? ''),
                    'route_path'   => (string) ($m->route_path ?? ''),
                    'order'        => (int) ($m->order_number ?? 0),
                    'is_active'    => (bool) ($m->is_active ?? true),
                    'product_code' => (string) ($m->product_code ?? ''),
                    'type'         => (string) ($m->type ?? 'menu'),
                    'level'        => (int) ($m->level ?? 1),
                    'color'        => $m->color,
                ];
            })
            ->values()
            ->all();

        return response()->json(['data' => $rows]);
    }

    /** POST /api/catalog/products/{codeOrId}/menus/sync */
//    private function normalizeTs(mixed $v): ?string
// {
//     if (empty($v)) return null;

//     // handle numeric epoch (detik/milis)
//     if (is_numeric($v)) {
//         try {
//             $ts = (int) $v;
//             if ($ts > 9999999999) { // milidetik
//                 $ts = (int) floor($ts / 1000);
//             }
//             return Carbon::createFromTimestamp($ts)->timezone(config('app.timezone'))->toDateTimeString();
//         } catch (\Throwable) { return null; }
//     }

//     // string: coba parse ISO-8601 termasuk 'T'/'Z'
//     if (is_string($v)) {
//         $s = trim($v);
//         if ($s === '' || $s === '0000-00-00 00:00:00' || $s === '0000-00-00') return null;
//         try {
//             return Carbon::parse($s)->timezone(config('app.timezone'))->toDateTimeString();
//         } catch (\Throwable) { return null; }
//     }
//     return null;
// }

// /** POST /api/catalog/products/{codeOrId}/menus/sync */
// public function syncMenus(Request $req, string $codeOrId, bool $silence = false): JsonResponse
// {
//     try {
//         /** @var \App\Services\WarehouseClient $wh */
//         $wh   = app(\App\Services\WarehouseClient::class);
//         $resp = $wh->menusByProduct($codeOrId);

//         $rows = $resp['data'] ?? $resp ?? [];
//         if (!is_array($rows)) $rows = [];

//         $now    = \Illuminate\Support\Carbon::now();
//         $nowStr = $now->toDateTimeString();

//         // --- 1) Index semua node by id ---
//         $rawIndex = [];
//         foreach ($rows as $m) {
//             $a = (array) $m;
//             $id = (int) ($a['id'] ?? 0);
//             if ($id > 0) $rawIndex[$id] = $a;
//         }

//         // helper akses
//         $safeArrGet = function (int $id) use (&$rawIndex) {
//             return $rawIndex[$id] ?? null;
//         };

//         // --- 2) Hitung parent valid ---
//         $getParentId = function (array $a) use ($codeOrId, $safeArrGet) {
//             $pid = $a['parent_id'] ?? null;
//             if ($pid === '' || $pid === null) return null;
//             $pid = (int) $pid;
//             if ($pid <= 0) return null;

//             $p = $safeArrGet($pid);
//             if (!$p) return null;

//             $prodChild  = (string) ($a['product_code'] ?? $codeOrId);
//             $prodParent = (string) ($p['product_code'] ?? $codeOrId);
//             if ($prodChild !== '' && $prodParent !== '' && $prodChild !== $prodParent) {
//                 return null;
//             }
//             return $pid;
//         };

//         // --- 3) Hitung level rekursif ---
//         $memoLevel = [];
//         $visiting  = [];
//         $computeLevel = function (int $id) use (&$computeLevel, &$memoLevel, &$visiting, $safeArrGet, $getParentId): int {
//             if (isset($memoLevel[$id])) return $memoLevel[$id];
//             if (!empty($visiting[$id])) return $memoLevel[$id] = 1; // siklus

//             $visiting[$id] = true;
//             $node = $safeArrGet($id);
//             if (!$node) { unset($visiting[$id]); return $memoLevel[$id] = 1; }

//             $pid = $getParentId($node);
//             if ($pid === null) { unset($visiting[$id]); return $memoLevel[$id] = 1; }

//             $lv = 1 + $computeLevel($pid);
//             unset($visiting[$id]);
//             return $memoLevel[$id] = max(1, min(127, $lv));
//         };

//         // --- 4) Normalisasi rows ---
//         $upsertsAll = [];
//         foreach ($rows as $m) {
//             $m = (array) $m;
//             $id = (int) ($m['id'] ?? 0);
//             if ($id <= 0) continue;

//             $pid   = $getParentId($m);
//             $ord   = (int) ($m['order'] ?? $m['order_number'] ?? 0);
//             $type  = strtoupper((string) ($m['type'] ?? 'menu'));
//             $level = $computeLevel($id);

//             $upsertsAll[] = [
//                 'id'              => $id,
//                 'parent_id'       => $pid,
//                 'level'           => $level,
//                 'type'            => in_array($type, ['GROUP','MODULE','MENU','SUBMENU']) ? strtolower($type) : 'menu',
//                 'title'           => (string) ($m['title'] ?? $m['name'] ?? 'Menu'),
//                 'icon'            => $m['icon']   ?? null,
//                 'color'           => $m['color']  ?? null,
//                 'order_number'    => $ord,
//                 'crud_builder_id' => $m['crud_builder_id'] ?? null,
//                 'product_code'    => (string) ($m['product_code'] ?? $codeOrId),
//                 'route_path'      => $m['route_path'] ?? null,
//                 'is_active'       => array_key_exists('is_active',$m) ? (bool)$m['is_active'] : true,
//                 'note'            => $m['note'] ?? null,
//                 'created_by'      => $m['created_by'] ?? null,
//                 'deleted_at'      => $this->normalizeTs($m['deleted_at'] ?? null),
//                 'updated_at'      => $this->normalizeTs($m['updated_at'] ?? null) ?? $nowStr,
//                 'created_at'      => $this->normalizeTs($m['created_at'] ?? null) ?? $nowStr,
//             ];
//         }

//         if (!count($upsertsAll)) {
//             return response()->json(['success'=>true,'message'=>'No menus to sync','count'=>0], 200);
//         }

//         // --- 5) Urutkan & upsert per level ---
//         usort($upsertsAll, fn($a,$b) => ($a['level'] <=> $b['level']) ?: ($a['id'] <=> $b['id']));
//         $byLevel = [];
//         foreach ($upsertsAll as $row) {
//             $byLevel[$row['level']][] = $row;
//         }

//         DB::transaction(function () use ($byLevel, $codeOrId, $nowStr) {
//             ksort($byLevel);
//             foreach ($byLevel as $lv => $rows) {
//                 DB::table('mst_menus')->upsert(
//                     $rows,
//                     ['id'],
//                     [
//                         'parent_id','level','type','title','icon','color',
//                         'order_number','crud_builder_id','product_code',
//                         'route_path','is_active','note','created_by',
//                         'deleted_at','updated_at','created_at',
//                     ]
//                 );
//             }
//             // soft-delete yg hilang
//             $allIds = collect($byLevel)->flatten(1)->pluck('id')->all();
//             \App\Models\Menu::forProduct($codeOrId)
//                 ->whereNotIn('id', $allIds)
//                 ->update(['deleted_at' => $nowStr]);
//         });

//         return response()->json([
//             'success' => true,
//             'message' => 'Menus synced',
//             'count'   => count($upsertsAll),
//         ], 200);

//     } catch (\Throwable $e) {
//         return response()->json(['success' => false, 'message' => 'Failed to sync menus: '.$e->getMessage()], 502);
//     }
// }
// tetap pakai helper normalisasi timestamp punyamu
private function normalizeTs(mixed $v): ?string
{
    if (empty($v)) return null;

    if (is_numeric($v)) {
        try {
            $ts = (int) $v;
            if ($ts > 9999999999) $ts = (int) floor($ts / 1000);
            return \Illuminate\Support\Carbon::createFromTimestamp($ts)
                ->timezone(config('app.timezone'))->toDateTimeString();
        } catch (\Throwable) { return null; }
    }

    if (is_string($v)) {
        $s = trim($v);
        if ($s === '' || $s === '0000-00-00 00:00:00' || $s === '0000-00-00') return null;
        try {
            return \Illuminate\Support\Carbon::parse($s)
                ->timezone(config('app.timezone'))->toDateTimeString();
        } catch (\Throwable) { return null; }
    }
    return null;
}

/** POST /api/catalog/products/{codeOrId}/menus/sync */
public function syncMenus(\Illuminate\Http\Request $req, string $codeOrId, bool $silence = false): \Illuminate\Http\JsonResponse
{
    try {
        /** @var \App\Services\WarehouseClient $wh */
        $wh   = app(\App\Services\WarehouseClient::class);
        $resp = $wh->menusByProduct($codeOrId);

        $rows = $resp['data'] ?? $resp ?? [];
        if (!is_array($rows)) $rows = [];

        $now    = \Illuminate\Support\Carbon::now();
        $nowStr = $now->toDateTimeString();

        // --- 1) Index semua node by id (untuk referensi parent) ---
        $rawIndex = [];
        foreach ($rows as $m) {
            $a = (array) $m;
            $id = (int) ($a['id'] ?? 0);
            if ($id > 0) $rawIndex[$id] = $a;
        }
        $safeArrGet = function (int $id) use (&$rawIndex) {
            return $rawIndex[$id] ?? null;
        };

        // --- 2) Ambil parent yg valid (TIDAK membuang parent karena product_code kosong) ---
        $getParentId = function (array $a) use ($codeOrId, $safeArrGet) {
            $pid = $a['parent_id'] ?? null;
            if ($pid === '' || $pid === null) return null;
            $pid = (int) $pid;
            if ($pid <= 0) return null;

            $p = $safeArrGet($pid);
            if (!$p) return null;

            // HANYA tolak jika KEDUA product_code terisi & berbeda.
            $prodChild  = trim((string) ($a['product_code'] ?? ''));
            $prodParent = trim((string) ($p['product_code'] ?? ''));
            if ($prodChild !== '' && $prodParent !== '' && $prodChild !== $prodParent) {
                return null;
            }
            return $pid;
        };

        // --- 3) Hitung level rekursif (1 = root, 2 = child, dst) ---
        $memoLevel = [];
        $visiting  = [];
        $computeLevel = function (int $id) use (&$computeLevel, &$memoLevel, &$visiting, $safeArrGet, $getParentId): int {
            if (isset($memoLevel[$id])) return $memoLevel[$id];
            if (!empty($visiting[$id])) return $memoLevel[$id] = 1; // cegah loop

            $visiting[$id] = true;
            $node = $safeArrGet($id);
            if (!$node) { unset($visiting[$id]); return $memoLevel[$id] = 1; }

            $pid = $getParentId($node);
            if ($pid === null) { unset($visiting[$id]); return $memoLevel[$id] = 1; }

            $lv = 1 + $computeLevel($pid);
            unset($visiting[$id]);
            return $memoLevel[$id] = max(1, min(127, $lv));
        };

        // --- 4) Normalisasi row + baca order dari banyak kandidat field ---
        $upsertsAll = [];
        foreach ($rows as $m) {
            $m = (array) $m;
            $id = (int) ($m['id'] ?? 0);
            if ($id <= 0) continue;

            $pid   = $getParentId($m);

            // kandidat key untuk urutan
            $ord = null;
            foreach (['order', 'order_number', 'sort', 'position', 'seq', 'ordering'] as $k) {
                if (array_key_exists($k, $m) && $m[$k] !== null && $m[$k] !== '') {
                    $ord = (int) $m[$k];
                    break;
                }
            }
            if ($ord === null) $ord = 0;

            $type  = strtoupper((string) ($m['type'] ?? 'menu'));
            $level = $computeLevel($id);

            $upsertsAll[] = [
                'id'              => $id,
                'parent_id'       => $pid,
                'level'           => $level,
                'type'            => in_array($type, ['GROUP','MODULE','MENU']) ? strtolower($type) : 'menu',
                'title'           => (string) ($m['title'] ?? $m['name'] ?? 'Menu'),
                'icon'            => $m['icon']   ?? null,
                'color'           => $m['color']  ?? null,
                'order_number'    => $ord, // akan difallback lagi per-sibling
                'crud_builder_id' => $m['crud_builder_id'] ?? null,
                'product_code'    => (string) ($m['product_code'] ?? $codeOrId),
                'route_path'      => $m['route_path'] ?? null,
                'is_active'       => array_key_exists('is_active',$m) ? (bool)$m['is_active'] : true,
                'note'            => $m['note'] ?? null,
                'deleted_at'      => $this->normalizeTs($m['deleted_at'] ?? null),
                'updated_at'      => $this->normalizeTs($m['updated_at'] ?? null) ?? $nowStr,
                'created_at'      => $this->normalizeTs($m['created_at'] ?? null) ?? $nowStr,
            ];
        }

        if (!count($upsertsAll)) {
            return response()->json(['success'=>true,'message'=>'No menus to sync','count'=>0], 200);
        }

        // --- 4.1) Fallback urutan per-sibling kalau 0/NULL ---
        $groups = [];
        foreach ($upsertsAll as $row) {
            $groups[$row['parent_id'] ?? 0][] = $row;  // parent_id null → grup 0
        }
        $upsertsAll = [];
        foreach ($groups as $parent => $children) {
            // sort awal: order_number asc, lalu title
            usort($children, function($a,$b){
                $ao = (int)($a['order_number'] ?? 0);
                $bo = (int)($b['order_number'] ?? 0);
                if ($ao !== $bo) return $ao <=> $bo;
                return strcmp((string)$a['title'], (string)$b['title']);
            });
            // assign fallback untuk yang 0/negatif → index+1
            $i = 1;
            foreach ($children as &$c) {
                if ((int)$c['order_number'] <= 0) {
                    $c['order_number'] = $i;
                }
                $i++;
            }
            unset($c);
            $upsertsAll = array_merge($upsertsAll, $children);
        }

        // --- 5) Urutkan & upsert per level (root dulu, baru anak) ---
        usort($upsertsAll, fn($a,$b) => ($a['level'] <=> $b['level']) ?: ($a['id'] <=> $b['id']));
        $byLevel = [];
        foreach ($upsertsAll as $row) {
            $byLevel[$row['level']][] = $row;
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($byLevel, $codeOrId, $nowStr) {
            ksort($byLevel);
            foreach ($byLevel as $lv => $rows) {
                \Illuminate\Support\Facades\DB::table('mst_menus')->upsert(
                    $rows,
                    ['id'],
                    [
                        'parent_id','level','type','title','icon','color',
                        'order_number','crud_builder_id','product_code',
                        'route_path','is_active','note','created_by' /* jika ada */,
                        'deleted_at','updated_at','created_at',
                    ]
                );
            }
            // soft-delete yg hilang dari upstream
            $allIds = collect($byLevel)->flatten(1)->pluck('id')->all();
            \App\Models\Menu::forProduct($codeOrId)
                ->whereNotIn('id', $allIds)
                ->update(['deleted_at' => $nowStr]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Menus synced',
            'count'   => count($upsertsAll),
        ], 200);

    } catch (\Throwable $e) {
        return response()->json(['success' => false, 'message' => 'Failed to sync menus: '.$e->getMessage()], 502);
    }
}


}


