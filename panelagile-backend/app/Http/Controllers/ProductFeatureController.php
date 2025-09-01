<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductFeature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

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

    /** GET /api/catalog/products/{code}/menus
     *  Sementara kosong supaya tidak "nyangkut" ke tab Menus.
     */
    public function listMenus(Request $req, string $codeOrId)
    {
        $product = $this->resolveProduct($codeOrId);
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        if ($req->boolean('refresh')) {
            $this->mirrorFromWarehouse($product->product_code);
        }

        return response()->json(['data' => []]);
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


}
