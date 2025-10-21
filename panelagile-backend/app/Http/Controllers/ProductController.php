<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

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
        // Normalisasi: paksa hanya A-Z dan 0-9 (hapus spasi, underscore, dash, dll) + uppercase
        if ($request->has('product_code')) {
            $code = (string) $request->input('product_code', '');
            $code = strtoupper(preg_replace('/[^A-Z0-9]/i', '', $code)); // keep A-Z0-9 only
            $request->merge([
                'product_code' => $code,
            ]);
        }

        $data = $request->validate([
            'product_code' => [
                'required',
                'string',
                'max:64',
                'unique:mst_products,product_code',
                'regex:/^[A-Z0-9]+$/', // hanya huruf kapital & angka
            ],
            'product_name' => 'required|string|max:160',
            'category'     => 'nullable|string|max:80',
            'status'       => 'nullable|string|max:32',
            'description'  => 'nullable|string',
            'db_name'      => ['required','string','max:60','regex:/^[A-Za-z0-9_]+$/'], // <— NEW
            'image'        => 'nullable|image|max:2048',
        ]);

        $product = new Product();
        $product->product_code  = $data['product_code'];
        $product->product_name  = $data['product_name'];
        $product->category      = $data['category'] ?? null;
        $product->status        = $data['status'] ?? 'Active';
        $product->description   = $data['description'] ?? null;
        $product->db_name       = $data['db_name'] ?? null;

        // handle image upload
        if ($request->hasFile('image')) {
            // simpan di storage/app/public/products/...
            $path = $request->file('image')->store('products', 'public');
            $product->image = $path;
        }

        $product->save();
        $product->refresh(); // agar accessor muncul

        return response()->json(['data' => $product], 201);
    }

    /**
     * PUT /api/products/{id}
     */
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        // Tidak mengizinkan ubah product_code (UI juga disabled).
        // Jika suatu saat diizinkan, aktifkan blok normalisasi & validasi berikut:
        /*
        if ($request->has('product_code')) {
            $code = (string) $request->input('product_code', '');
            $code = strtoupper(preg_replace('/[^A-Z0-9]/i', '', $code));
            $request->merge(['product_code' => $code]);
        }
        */

        $data = $request->validate([
            // 'product_code' => [
            //     'sometimes',
            //     'string',
            //     'max:64',
            //     'regex:/^[A-Z0-9]+$/',
            //     'unique:mst_products,product_code,' . $product->id,
            // ],
            'product_name' => 'required|string|max:160',
            'category'     => 'nullable|string|max:80',
            'status'       => 'nullable|string|max:32',
            'description'  => 'nullable|string',
            'db_name'  => 'required|string|max:60',
            'image'        => 'nullable|image|max:2048',
        ]);

        $product->product_name = $data['product_name'];
        $product->category     = $data['category'] ?? $product->category;
        $product->status       = $data['status'] ?? $product->status;
        $product->description  = $data['description'] ?? $product->description;
        $product->db_name      = $data['db_name'] ?? $product->db_name;

        // image handling: jika ada file baru -> simpan dan hapus file lama (opsional)
        if ($request->hasFile('image')) {
            // hapus file lama jika ada
            if ($product->image && Storage::disk('public')->exists($product->image)) {
                Storage::disk('public')->delete($product->image);
            }
            $path = $request->file('image')->store('products', 'public');
            $product->image = $path;
        }

        $product->save();
        $product->refresh();

        return response()->json(['data' => $product]);
    }

    /**
     * DELETE /api/products/{id}
     */
    public function destroy($id)
    {
        $product = Product::findOrFail($id);

        // optional: hapus file image saat delete
        if ($product->image && Storage::disk('public')->exists($product->image)) {
            Storage::disk('public')->delete($product->image);
        }

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
            $product = Product::updateOrCreate(
                ['product_code' => $row['product_code']],
                [
                    'product_name'       => $row['product_name'] ?? '',
                    'category'           => $row['category'] ?? null,
                    'status'             => $row['status'] ?? 'Active',
                    'description'        => $row['description'] ?? null,
                    'db_name'            => $row['db_name'] ?? null,
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
