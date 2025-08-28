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
    public function index()
    {
        return response()->json([
            'data' => Product::orderBy('created_at', 'desc')->get()
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
     */
    public function sync()
    {
        // panggil warehouse API
        $warehouseUrl = config('services.warehouse.base') . '/catalog/products';
        $clientKey    = config('services.warehouse.key');

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

        $items = $response->json();
        $synced = [];

        foreach ($items as $row) {
            $product = Product::updateOrCreate(
                ['product_code' => $row['product_code']],
                [
                    'product_name'       => $row['product_name'] ?? '',
                    'category'           => $row['category'] ?? null,
                    'status'             => $row['status'] ?? 'Active',
                    'description'        => $row['description'] ?? null,
                    'total_features'     => $row['total_features'] ?? 0,
                    'upstream_updated_at'=> $row['updated_at'] ?? null,
                ]
            );
            $synced[] = $product;
        }

        return response()->json([
            'message' => 'Sync complete',
            'count'   => count($synced),
            'data'    => $synced,
        ]);
    }
}
