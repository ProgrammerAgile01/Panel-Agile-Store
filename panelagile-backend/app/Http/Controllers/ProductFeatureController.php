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

class ProductFeatureController extends Controller
{
    /** ============================
     *  PUBLIC (tanpa JWT) — READ
     *  ============================
     */

    /** GET /api/catalog/products/{code}/features?refresh=1 */
    public function listFeatures(Request $req, string $codeOrId)
    {
        $product = $this->resolveProduct($codeOrId);
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        if ($req->boolean('refresh')) {
            $this->mirrorFromWarehouse($product->product_code);
        }

        $rows = ProductFeature::where('product_code', $product->product_code)
            ->orderByRaw('COALESCE(order_number, 999999)')
            ->orderBy('name')
            ->get();

        $data = $rows->map(function (ProductFeature $r) {
            return [
                'id'               => (string)$r->id,
                'feature_code'     => (string)$r->feature_code,
                'name'             => (string)$r->name,
                'description'      => (string)($r->description ?? ''),
                'module_name'      => (string)($r->module_name ?? 'General'),
                'item_type'        => (string)$r->item_type,        // FEATURE / SUBFEATURE
                'parent_id'        => null,
                'parent_code'      => null,
                'menu_parent_code' => (string)($r->menu_parent_code ?? ''),
                'is_active'        => (bool)$r->is_active,
                'order_number'     => (int)($r->order_number ?? 0),
                'price_addon'      => (float)($r->price_addon ?? 0),   // TERLIHAT DI FE
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
    public function syncFeatures(string $codeOrId)
    {
        $product = $this->resolveProduct($codeOrId);
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $counts = $this->mirrorFromWarehouse($product->product_code);
        return response()->json(['message' => 'Sync complete', 'counts' => $counts]);
    }

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

    $row = \App\Models\ProductFeature::where('product_code', $product->product_code)
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
     */
  protected function mirrorFromWarehouse(string $productCode): array
{
    $base = rtrim((string) config('services.warehouse.base'), '/');
    $key  = (string) config('services.warehouse.key');
    $headers = ['X-CLIENT-KEY'=>$key,'Accept'=>'application/json'];

    $fres = \Illuminate\Support\Facades\Http::withHeaders($headers)
        ->get($base."/catalog/products/{$productCode}/features");
    if ($fres->failed()) {
        $msg = $fres->json('message') ?? ($fres->status().' '.$fres->reason());
        throw new \RuntimeException("Failed to fetch features from warehouse: ".$msg);
    }

    $features = $fres->json('data') ?? [];
    if (!is_array($features)) $features = [];

    // parent_id -> feature_code map
    $idToCode = [];
    foreach ($features as $f) {
        $fid  = (string)($f['id'] ?? '');
        $fcode= (string)($f['feature_code'] ?? $f['code'] ?? '');
        if ($fid !== '' && $fcode !== '') $idToCode[$fid] = $fcode;
    }

    $countF = 0; $countS = 0; $now = now();

    foreach ($features as $f) {
        $typeRaw  = strtoupper((string)($f['item_type'] ?? $f['type'] ?? 'FEATURE'));
        $itemType = in_array($typeRaw, ['FEATURE','SUBFEATURE'], true) ? $typeRaw : 'FEATURE';

        $nameRaw  = trim((string)($f['name'] ?? $f['feature_name'] ?? $f['title'] ?? $f['slug'] ?? ''));
        $codeRaw  = trim((string)($f['feature_code'] ?? $f['code'] ?? ''));
        if ($codeRaw === '') {
            $codeRaw = $nameRaw !== '' ? \Illuminate\Support\Str::slug($nameRaw, '.') : ('feat.'.\Illuminate\Support\Str::uuid()->toString());
        }
        $name = $nameRaw !== '' ? $nameRaw : $codeRaw;

        $parentCode = null;
        if ($itemType === 'SUBFEATURE') {
            $pid = $f['parent_id'] ?? null;
            if ($pid !== null && isset($idToCode[(string)$pid])) $parentCode = $idToCode[(string)$pid];
        }

        // ==== Kunci unik: product_code + feature_code + item_type ====
        $pf = \App\Models\ProductFeature::firstOrNew([
            'product_code' => $productCode,
            'feature_code' => $codeRaw,
            'item_type'    => $itemType,
        ]);

        // sync field umum
        $pf->id               = (string)($pf->exists ? $pf->id : ($f['id'] ?? $productCode.'|'.$codeRaw.'|'.$itemType));
        $pf->name             = $name;
        $pf->description      = (string)($f['description'] ?? '');
        $pf->module_name      = (string)($f['module_name'] ?? $f['module'] ?? $f['category'] ?? 'General');
        $pf->menu_parent_code = $parentCode;
        $pf->is_active        = !(
            (isset($f['is_active']) && $f['is_active'] === false) ||
            (isset($f['status']) && in_array(strtolower((string)$f['status']), ['inactive','disabled'], true))
        );
        $pf->order_number     = (int)($f['order_number'] ?? 0);

        // ==== ini kuncinya ====
        if (!$pf->exists) {
            // record baru → boleh seed dari warehouse (parent saja)
            $pf->price_addon = $itemType === 'FEATURE'
                ? (float)($f['price_addon'] ?? 0)
                : 0.0;
            $pf->created_at = $now;
        } else {
            // record existing → JANGAN ubah price_addon (biarkan hasil edit panel)
            if ($itemType === 'SUBFEATURE' && (float)$pf->price_addon !== 0.0) {
                $pf->price_addon = 0.0; // jaga agar subfeature tetap 0
            }
        }

        $pf->trial_available  = (bool)($f['trial_available'] ?? false);
        $pf->trial_days       = isset($f['trial_days']) ? (int)$f['trial_days'] : null;
        $pf->synced_at        = $now;
        $pf->updated_at       = $now;
        $pf->save();

        if ($itemType === 'FEATURE') $countF++; else $countS++;
    }

    return ['features'=>$countF,'subfeatures'=>$countS];
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
   private function normalizeTs(mixed $v): ?string
{
    if (empty($v)) return null;

    // handle numeric epoch (detik/milis)
    if (is_numeric($v)) {
        try {
            $ts = (int) $v;
            if ($ts > 9999999999) { // milidetik
                $ts = (int) floor($ts / 1000);
            }
            return Carbon::createFromTimestamp($ts)->timezone(config('app.timezone'))->toDateTimeString();
        } catch (\Throwable) { return null; }
    }

    // string: coba parse ISO-8601 termasuk 'T'/'Z'
    if (is_string($v)) {
        $s = trim($v);
        if ($s === '' || $s === '0000-00-00 00:00:00' || $s === '0000-00-00') return null;
        try {
            return Carbon::parse($s)->timezone(config('app.timezone'))->toDateTimeString();
        } catch (\Throwable) { return null; }
    }
    return null;
}

/** POST /api/catalog/products/{codeOrId}/menus/sync */
public function syncMenus(Request $req, string $codeOrId, bool $silence = false): JsonResponse
{
    try {
        /** @var \App\Services\WarehouseClient $wh */
        $wh   = app(\App\Services\WarehouseClient::class);
        $resp = $wh->menusByProduct($codeOrId);

        $rows = $resp['data'] ?? $resp ?? [];
        if (!is_array($rows)) $rows = [];

        $now    = \Illuminate\Support\Carbon::now();
        $nowStr = $now->toDateTimeString();

        // --- 1) Index semua node by id ---
        $rawIndex = [];
        foreach ($rows as $m) {
            $a = (array) $m;
            $id = (int) ($a['id'] ?? 0);
            if ($id > 0) $rawIndex[$id] = $a;
        }

        // helper akses
        $safeArrGet = function (int $id) use (&$rawIndex) {
            return $rawIndex[$id] ?? null;
        };

        // --- 2) Hitung parent valid ---
        $getParentId = function (array $a) use ($codeOrId, $safeArrGet) {
            $pid = $a['parent_id'] ?? null;
            if ($pid === '' || $pid === null) return null;
            $pid = (int) $pid;
            if ($pid <= 0) return null;

            $p = $safeArrGet($pid);
            if (!$p) return null;

            $prodChild  = (string) ($a['product_code'] ?? $codeOrId);
            $prodParent = (string) ($p['product_code'] ?? $codeOrId);
            if ($prodChild !== '' && $prodParent !== '' && $prodChild !== $prodParent) {
                return null;
            }
            return $pid;
        };

        // --- 3) Hitung level rekursif ---
        $memoLevel = [];
        $visiting  = [];
        $computeLevel = function (int $id) use (&$computeLevel, &$memoLevel, &$visiting, $safeArrGet, $getParentId): int {
            if (isset($memoLevel[$id])) return $memoLevel[$id];
            if (!empty($visiting[$id])) return $memoLevel[$id] = 1; // siklus

            $visiting[$id] = true;
            $node = $safeArrGet($id);
            if (!$node) { unset($visiting[$id]); return $memoLevel[$id] = 1; }

            $pid = $getParentId($node);
            if ($pid === null) { unset($visiting[$id]); return $memoLevel[$id] = 1; }

            $lv = 1 + $computeLevel($pid);
            unset($visiting[$id]);
            return $memoLevel[$id] = max(1, min(127, $lv));
        };

        // --- 4) Normalisasi rows ---
        $upsertsAll = [];
        foreach ($rows as $m) {
            $m = (array) $m;
            $id = (int) ($m['id'] ?? 0);
            if ($id <= 0) continue;

            $pid   = $getParentId($m);
            $ord   = (int) ($m['order'] ?? $m['order_number'] ?? 0);
            $type  = strtoupper((string) ($m['type'] ?? 'menu'));
            $level = $computeLevel($id);

            $upsertsAll[] = [
                'id'              => $id,
                'parent_id'       => $pid,
                'level'           => $level,
                'type'            => in_array($type, ['GROUP','MODULE','MENU','SUBMENU']) ? strtolower($type) : 'menu',
                'title'           => (string) ($m['title'] ?? $m['name'] ?? 'Menu'),
                'icon'            => $m['icon']   ?? null,
                'color'           => $m['color']  ?? null,
                'order_number'    => $ord,
                'crud_builder_id' => $m['crud_builder_id'] ?? null,
                'product_code'    => (string) ($m['product_code'] ?? $codeOrId),
                'route_path'      => $m['route_path'] ?? null,
                'is_active'       => array_key_exists('is_active',$m) ? (bool)$m['is_active'] : true,
                'note'            => $m['note'] ?? null,
                'created_by'      => $m['created_by'] ?? null,
                'deleted_at'      => $this->normalizeTs($m['deleted_at'] ?? null),
                'updated_at'      => $this->normalizeTs($m['updated_at'] ?? null) ?? $nowStr,
                'created_at'      => $this->normalizeTs($m['created_at'] ?? null) ?? $nowStr,
            ];
        }

        if (!count($upsertsAll)) {
            return response()->json(['success'=>true,'message'=>'No menus to sync','count'=>0], 200);
        }

        // --- 5) Urutkan & upsert per level ---
        usort($upsertsAll, fn($a,$b) => ($a['level'] <=> $b['level']) ?: ($a['id'] <=> $b['id']));
        $byLevel = [];
        foreach ($upsertsAll as $row) {
            $byLevel[$row['level']][] = $row;
        }

        DB::transaction(function () use ($byLevel, $codeOrId, $nowStr) {
            ksort($byLevel);
            foreach ($byLevel as $lv => $rows) {
                DB::table('mst_menus')->upsert(
                    $rows,
                    ['id'],
                    [
                        'parent_id','level','type','title','icon','color',
                        'order_number','crud_builder_id','product_code',
                        'route_path','is_active','note','created_by',
                        'deleted_at','updated_at','created_at',
                    ]
                );
            }
            // soft-delete yg hilang
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


