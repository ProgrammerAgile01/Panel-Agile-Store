<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductCatalogController extends Controller
{
    /**
     * GET /api/catalog/products
     * Query: ?q=...&per_page=...
     * - Jika per_page ada -> paginator {data, links, meta}
     * - Jika tidak -> {data: [...]}
     */
    public function index(Request $request)
    {
        $q        = trim((string) $request->query('q', ''));
        $perPage  = (int) $request->query('per_page', 0);

        $builder = Product::query()
            ->when($q !== '', function ($w) use ($q) {
                $like = '%' . str_replace(' ', '%', $q) . '%';
                $w->where(function ($s) use ($like) {
                    $s->where('product_name', 'like', $like)
                      ->orWhere('product_code', 'like', $like)
                      ->orWhere('category', 'like', $like)
                      ->orWhere('description', 'like', $like)
                      ->orWhere('db_name', 'like', $like);
                });
            })
            ->orderByDesc('created_at');

        if ($perPage > 0) {
            $pag = $builder->paginate($perPage)->appends($request->query());
            return response()->json($pag);
        }

        $rows = $builder->get();

        return response()->json([
            'data' => $rows,
        ]);
    }

    /**
     * GET /api/catalog/products/{codeOrId}
     * - Bisa ambil by numeric id atau product_code
     */
    public function show(string $codeOrId)
    {
        $row = Product::when(ctype_digit($codeOrId), function ($w) use ($codeOrId) {
                $w->where('id', (int) $codeOrId);
            }, function ($w) use ($codeOrId) {
                $w->where('product_code', $codeOrId);
            })
            ->first();

        if (!$row) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json(['data' => $row]);
    }
}
