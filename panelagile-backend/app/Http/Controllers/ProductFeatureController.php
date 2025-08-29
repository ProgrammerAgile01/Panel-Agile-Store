<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductFeature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ProductFeatureController extends Controller
{
    /** GET /api/catalog/products/{code}/features */
    public function listFeatures(Request $req, string $codeOrId)
    {
        $product = $this->resolveProduct($codeOrId);
        if (!$product) return response()->json(['message'=>'Product not found'],404);

        if ($req->boolean('refresh')) $this->mirrorFromWarehouse($product->product_code);

        // kirim semua item (FEATURE & SUBFEATURE), FE yang menyusun tree
        $rows = ProductFeature::where('product_code',$product->product_code)
            ->orderByRaw('COALESCE(order_number, 999999)')
            ->orderBy('name')
            ->get();

        $data = $rows->map(function ($r) {
            return [
                'id'               => (string)$r->id,
                'feature_code'     => (string)$r->feature_code,
                'name'             => (string)$r->name,
                'description'      => (string)($r->description ?? ''),
                'module_name'      => (string)($r->module_name ?? 'General'),
                'item_type'        => (string)$r->item_type,            // FEATURE / SUBFEATURE
                'parent_id'        => null,
                'parent_code'      => null,
                'menu_parent_code' => (string)($r->menu_parent_code ?? ''), // FE gunakan utk tree
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

        return response()->json(['data'=>$data]);
    }

    /** GET /api/catalog/products/{code}/menus
     *  Untuk saat ini, jangan ambil dari fitur supaya tidak nyasar ke tab Menus.
     */
    public function listMenus(Request $req, string $codeOrId)
    {
        $product = $this->resolveProduct($codeOrId);
        if (!$product) return response()->json(['message'=>'Product not found'],404);

        if ($req->boolean('refresh')) $this->mirrorFromWarehouse($product->product_code);

        return response()->json(['data' => []]);
    }

    /** POST /api/catalog/products/{code}/features/sync */
    public function syncFeatures(string $codeOrId)
    {
        $product = $this->resolveProduct($codeOrId);
        if (!$product) return response()->json(['message'=>'Product not found'],404);

        $counts = $this->mirrorFromWarehouse($product->product_code);
        return response()->json(['message'=>'Sync complete','counts'=>$counts]);
    }

    /* ===================== Helpers ===================== */

    protected function resolveProduct(string $codeOrId): ?Product
    {
        return Product::where('product_code',$codeOrId)->orWhere('id',$codeOrId)->first();
    }

    /**
     * Tarik fitur dari Warehouse dan mirror ke mst_product_features
     * Wajibkan 'feature_code', & 'name' tidak boleh kosong.
     */
    protected function mirrorFromWarehouse(string $productCode): array
    {
        $base = rtrim((string) config('services.warehouse.base'), '/');
        $key  = (string) config('services.warehouse.key');
        $headers = ['X-CLIENT-KEY'=>$key,'Accept'=>'application/json'];

        $fres = Http::withHeaders($headers)
            ->get($base."/catalog/products/{$productCode}/features");

        if ($fres->failed()) {
            $msg = $fres->json('message') ?? ($fres->status().' '.$fres->reason());
            throw new \RuntimeException("Failed to fetch features from warehouse: ".$msg);
        }

        $features = $fres->json('data') ?? $fres->json() ?? [];
        if (!is_array($features)) $features = [];
        // dd($features);

        // id upstream -> feature_code untuk binding child
        $idToCode = [];
        foreach ($features as $f) {
            $fid  = (string)($f['id'] ?? '');
            $fcode= (string)($f['feature_code'] ?? $f['code'] ?? '');
            if ($fid !== '') $idToCode[$fid] = $fcode;
        }

        $countF=0; $countS=0;
        $now = now();

        foreach ($features as $f) {
            $typeRaw  = strtoupper((string)($f['item_type'] ?? $f['type'] ?? 'FEATURE'));
            $itemType = in_array($typeRaw, ['FEATURE','SUBFEATURE'], true) ? $typeRaw : 'FEATURE';

            $nameRaw  = trim((string)($f['name'] ?? $f['feature_name'] ?? $f['title'] ?? $f['slug'] ?? ''));
            $codeRaw  = trim((string)($f['feature_code'] ?? $f['code'] ?? ''));

            if ($codeRaw === '') {
                $codeRaw = $nameRaw !== '' ? Str::slug($nameRaw, '.') : ('feat.'.Str::uuid()->toString());
            }

            $name = $nameRaw !== '' ? $nameRaw : $codeRaw;

            $parentCode = null;
            if ($itemType === 'SUBFEATURE') {
                $pid = $f['parent_id'] ?? null;
                if ($pid !== null && isset($idToCode[(string)$pid])) {
                    $parentCode = $idToCode[(string)$pid];
                }
            }

            ProductFeature::updateOrCreate(
                [
                    'id' => (string)($f['id'] ?? $productCode.'|'.$codeRaw.'|'.$itemType),
                ],
                [
                    'product_code'     => $productCode,
                    'item_type'        => $itemType,
                    'feature_code'     => $codeRaw,
                    'name'             => $name,
                    'description'      => (string)($f['description'] ?? ''),
                    'module_name'      => (string)($f['module_name'] ?? $f['module'] ?? $f['category'] ?? 'General'),
                    'menu_parent_code' => $parentCode,
                    'is_active'        => !(
                        (isset($f['is_active']) && $f['is_active'] === false) ||
                        (isset($f['status']) && in_array(strtolower((string)$f['status']), ['inactive','disabled'], true))
                    ),
                    'order_number'     => (int)($f['order_number'] ?? 0),
                    'price_addon'      => (float)($f['price_addon'] ?? 0),
                    'trial_available'  => (bool)($f['trial_available'] ?? false),
                    'trial_days'       => isset($f['trial_days']) ? (int)$f['trial_days'] : null,
                    'synced_at'        => $now,
                    'updated_at'       => $now,
                    'created_at'       => $now,
                ]
            );

            if ($itemType === 'FEATURE') $countF++; else $countS++;
        }

        return ['features'=>$countF,'subfeatures'=>$countS];
    }
}
