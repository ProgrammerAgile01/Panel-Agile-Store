<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ProductController extends Controller
{
    /**
     * GET /api/products
     */
    public function index(Request $request)
    {
        // (opsional) dukung q
        $q = $request->query('q');
        $query = Product::query()->orderBy('created_at', 'desc');
        if ($q) {
            $query->where(function ($w) use ($q) {
                $w->where('product_name', 'like', "%{$q}%")
                  ->orWhere('product_code', 'like', "%{$q}%")
                  ->orWhere('category', 'like', "%{$q}%");
            });
        }

        return response()->json([
            'data' => $query->get(),
        ]);
    }

    /**
     * GET /api/products/{id}
     */
    public function show($id)
    {
        $product = Product::findOrFail($id);
        return response()->json(['data' => $product]);
    }

    /**
     * POST /api/products
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'product_code' => 'required|string|max:64|unique:mst_products,product_code',
            'product_name' => 'required|string|max:160',
            'category'     => 'nullable|string|max:80',
            'status'       => 'nullable|string|max:32',
            'description'  => 'nullable|string',
            'db_name'      => ['required','string','max:60','regex:/^[A-Za-z0-9_]+$/'], // <— NEW
        ]);

        $product = Product::create($data);

        return response()->json(['data' => $product], 201);
    }

    /**
     * PUT /api/products/{id}
     */
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $data = $request->validate([
            'product_name' => 'required|string|max:160',
            'category'     => 'nullable|string|max:80',
            'status'       => 'nullable|string|max:32',
            'description'  => 'nullable|string',
            'db_name'      => ['required','string','max:60','regex:/^[A-Za-z0-9_]+$/'], // <— NEW (boleh diubah)
        ]);

        $product->update($data);

        return response()->json(['data' => $product]);
    }

    /**
     * DELETE /api/products/{id}
     */
    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json(['message' => 'Product deleted']);
    }

    /**
     * GET /api/products/sync
     * Sync produk dari Warehouse → simpan/update ke mst_products
     * (db_name TIDAK ditimpa bila tidak dikirim dari Warehouse)
     */
    public function sync()
    {
        $warehouseUrl = rtrim((string) config('services.warehouse.base'), '/').'/catalog/products';
        $clientKey    = (string) config('services.warehouse.key');

        $response = Http::withHeaders([
            'X-CLIENT-KEY' => $clientKey,
            'Accept'       => 'application/json',
        ])->get($warehouseUrl);

        if ($response->failed()) {
            return response()->json([
                'message' => 'Failed to fetch products from warehouse',
                'error'   => $response->json()
            ], 500);
        }

        // Response gateway biasanya { data: [...] }
        $payload = $response->json();
        $items = is_array($payload) ? $payload : ($payload['data'] ?? []);
        if (!is_array($items)) $items = [];

        $synced = [];

        foreach ($items as $row) {
            $code = $row['product_code'] ?? null;
            if (!$code) continue;

            // Cari dulu agar db_name lama tidak hilang jika upstream tidak kirim
            $existing = Product::where('product_code', $code)->first();

            $data = [
                'product_name'        => $row['product_name'] ?? ($existing->product_name ?? $code),
                'category'            => $row['category'] ?? ($existing->category ?? null),
                'status'              => $row['status'] ?? ($existing->status ?? 'Active'),
                'description'         => $row['description'] ?? ($existing->description ?? null),
                'total_features'      => $row['total_features'] ?? ($existing->total_features ?? 0),
                'upstream_updated_at' => $row['updated_at'] ?? ($existing->upstream_updated_at ?? null),
                // db_name: pakai dari upstream kalau ada, else pertahankan eksisting
                'db_name'             => $row['db_name'] ?? ($existing->db_name ?? ''), // <— keep existing
            ];

            if ($existing) {
                $existing->update($data);
                $synced[] = $existing->fresh();
            } else {
                $created = Product::create(array_merge($data, [
                    'product_code' => $code,
                ]));
                $synced[] = $created;
            }
        }

        return response()->json([
            'message' => 'Sync complete',
            'count'   => count($synced),
            'data'    => $synced,
        ]);
    }
}
