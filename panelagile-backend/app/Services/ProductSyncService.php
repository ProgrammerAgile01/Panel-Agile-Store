<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ProductSyncService
{
    public function __construct(private WarehouseClient $wh) {}

    /** Tarik semua produk dari Warehouse dan upsert ke DB Panel */
    public function syncAll(array $options = []): array
    {
        // kamu bisa terima query seperti per_page atau q dari $options
        $query = [];
        if (isset($options['q']))       $query['q'] = $options['q'];
        if (isset($options['per_page'])) $query['per_page'] = (int) $options['per_page'];

        $payload = $this->wh->listProducts($query);

        // Warehouse bisa return paginator (data, links, meta) atau array data langsung.
        $rows = $payload['data'] ?? $payload ?? [];
        if (!is_array($rows)) $rows = [];

        // Jika paginator, $rows biasanya adalah array of items; kalau bukan, normalisasi
        $items = [];
        foreach ($rows as $k => $v) {
            // Jika $rows adalah associative paginator {data:[], links:..., meta:...}
            if (is_string($k) && $k === 'data' && is_array($v)) {
                $items = $v;
                break;
            }
        }
        if (!count($items)) $items = $rows;

        $affected = 0;
        DB::transaction(function () use ($items, &$affected) {
            foreach ($items as $r) {
                $code = (string) ($r['product_code'] ?? '');
                if ($code === '') continue;

                Product::updateOrCreate(
                    ['product_code' => $code],
                    [
                        'product_name'        => $r['product_name'] ?? $code,
                        'category'            => $r['category'] ?? 'General',
                        'status'              => $r['status'] ?? 'Active',
                        'description'         => Arr::get($r, 'description'),
                        'total_features'      => (int) ($r['total_features'] ?? 0),
                        'upstream_updated_at' => $this->toTs(Arr::get($r, 'upstream_updated_at') ?? Arr::get($r, 'updated_at')),
                    ]
                );
                $affected++;
            }
        });

        return ['synced' => $affected];
    }

    /** Tarik satu produk by idOrCode dan upsert ke DB Panel */
    public function syncOne(string $idOrCode): ?Product
    {
        $payload = $this->wh->getProduct($idOrCode);
        $r = $payload['data'] ?? $payload ?? null;
        if (!$r || !is_array($r)) return null;

        $code = (string) ($r['product_code'] ?? $idOrCode);
        return Product::updateOrCreate(
            ['product_code' => $code],
            [
                'product_name'        => $r['product_name'] ?? $code,
                'category'            => $r['category'] ?? 'General',
                'status'              => $r['status'] ?? 'Active',
                'description'         => $r['description'] ?? null,
                'total_features'      => (int) ($r['total_features'] ?? 0),
                'upstream_updated_at' => $this->toTs($r['upstream_updated_at'] ?? $r['updated_at'] ?? null),
            ]
        );
    }

    private function toTs($val): ?Carbon
    {
        try { return $val ? Carbon::parse($val) : null; } catch (\Throwable) { return null; }
    }
}
