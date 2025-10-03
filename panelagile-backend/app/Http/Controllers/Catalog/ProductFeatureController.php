<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductFeature;
use App\Models\ProductMenu;
use App\Services\WarehouseClient;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductFeatureController extends Controller
{
    public function __construct(protected WarehouseClient $wh) {}

    /** GET /api/catalog/products/{codeOrId}/features  (read mirror) */
    public function listFeatures(string $codeOrId)
    {
        $p = $this->findProduct($codeOrId);
        if (!$p) return response()->json(['message' => 'Not found'], 404);

        // ambil dari tabel Panel (mirror) — bukan dari Warehouse langsung
        $rows = ProductFeature::where('product_code', $p->product_code)
            ->orderBy('module_name')->orderBy('order_number')->get();

        return response()->json(['data' => $rows]);
    }

    /** POST /api/catalog/products/{codeOrId}/features/sync */
    public function syncFeatures(string $codeOrId)
    {
        $p = $this->findProduct($codeOrId);
        if (!$p) return response()->json(['message' => 'Not found'], 404);

        // 1) tarik dari Warehouse (yang proxy ke product app)
        $payload = $this->wh->featuresByProduct($p->product_code);
        $rows    = $payload['data'] ?? [];
        if (!is_array($rows)) $rows = [];

        // 2) upsert ke tabel Panel
        $count = 0;
        foreach ($rows as $r) {
            $id  = (string) ($r['id'] ?? '');
            if ($id === '') continue;

            ProductFeature::updateOrCreate(
                ['product_code' => $p->product_code, 'external_id' => $id],
                [
                    'feature_code'    => (string)($r['feature_code'] ?? ''),
                    'name'            => (string)($r['name'] ?? ''),
                    'description'     => $r['description'] ?? null,
                    'module_name'     => (string)($r['module_name'] ?? 'General'),
                    'item_type'       => strtoupper((string)($r['item_type'] ?? 'FEATURE')),
                    'parent_external_id' => $r['parent_id'] ?? null,
                    'is_active'       => (bool)($r['is_active'] ?? true),
                    'order_number'    => (int)($r['order_number'] ?? 0),
                    'price_addon'     => isset($r['price_addon']) ? (float)$r['price_addon'] : 0,
                    'trial_available' => (bool)($r['trial_available'] ?? false),
                    'trial_days'      => $r['trial_days'] !== null ? (int)$r['trial_days'] : null,
                ]
            );
            $count++;
        }

        return response()->json(['success' => true, 'count' => $count]);
    }

    /** GET /api/catalog/products/{codeOrId}/menus */
    public function listMenus(string $codeOrId)
    {
        $p = $this->findProduct($codeOrId);
        if (!$p) return response()->json(['message' => 'Not found'], 404);

        $rows = ProductMenu::where('product_code', $p->product_code)
            ->orderBy('order_number')->get();

        return response()->json(['data' => $rows]);
    }

    /** POST /api/catalog/products/{codeOrId}/menus/sync */
    public function syncMenus(string $codeOrId)
    {
        $p = $this->findProduct($codeOrId);
        if (!$p) return response()->json(['message' => 'Not found'], 404);

        // ke Warehouse
        $payload = $this->wh->menusByProduct($p->product_code);
        $rows    = $payload['data'] ?? [];
        if (!is_array($rows)) $rows = [];

        $count = 0;
        foreach ($rows as $r) {
            $rid = $r['id'] ?? null; // integer
            if ($rid === null) continue;

            ProductMenu::updateOrCreate(
                ['product_code' => $p->product_code, 'external_id' => (string)$rid],
                [
                    'parent_external_id' => isset($r['parent_id']) ? (string)$r['parent_id'] : null,
                    'title'        => (string)($r['title'] ?? 'Menu'),
                    'icon'         => (string)($r['icon'] ?? ''),
                    'route_path'   => (string)($r['route_path'] ?? ''),
                    'order_number' => (int)($r['order_number'] ?? $r['order'] ?? 0),
                    'is_active'    => (bool)($r['is_active'] ?? true),
                    'type'         => (string)($r['type'] ?? 'menu'),
                ]
            );
            $count++;
        }

        return response()->json(['success' => true, 'count' => $count]);
    }

    protected function findProduct(string $codeOrId): ?Product
    {
        return Product::when(ctype_digit($codeOrId), fn($q) => $q->where('id', (int)$codeOrId),
                             fn($q) => $q->where('product_code', $codeOrId))->first();
    }
}
