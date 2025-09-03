<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ProductSyncController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Product::orderBy('created_at', 'desc')->get()
        ]);
    }

    public function sync()
    {
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
                    'db_name'        => $row['db_name'] ?? null,
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
