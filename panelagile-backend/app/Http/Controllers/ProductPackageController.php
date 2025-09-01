<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Product;
use App\Models\ProductPackage;

class ProductPackageController extends Controller
{
    /**
     * PUBLIC — daftar paket per product (default hanya active).
     * GET /api/catalog/products/{codeOrId}/packages?include_inactive=1
     */
    public function listByProduct(Request $request, string $codeOrId)
    {
        $includeInactive = (int)$request->query('include_inactive', 0) === 1;

        $q = ProductPackage::query()
            ->where(function ($qq) use ($codeOrId) {
                $qq->where('product_code', $codeOrId);
                if (is_numeric($codeOrId)) {
                    $qq->orWhere('product_id', (int)$codeOrId);
                }
            });

        if (!$includeInactive) {
            $q->where('status', 'active');
        }

        $rows = $q->orderBy('order_number')->orderBy('id')->get([
            'id',
            'product_id',
            'product_code',
            'package_code',
            'name',
            'description',
            'status',
            'notes',
            'order_number',
            'created_at',
            'updated_at',
            'deleted_at',
        ]);

        return response()->json(['data' => $rows]);
    }

    /**
     * ADMIN (JWT) — list packages (dengan filter).
     * GET /api/packages?product_code=&product_id=&status=&q=&per_page=
     */
    public function index(Request $request)
    {
        $q = ProductPackage::query();

        if ($pc = $request->query('product_code')) {
            $q->where('product_code', $pc);
        }
        if ($pid = $request->query('product_id')) {
            $q->where('product_id', $pid);
        }
        if ($st = $request->query('status')) {
            $q->where('status', $st);
        }
        if ($kw = trim((string)$request->query('q', ''))) {
            $q->where(function ($qq) use ($kw) {
                $qq->where('name', 'like', "%{$kw}%")
                   ->orWhere('description', 'like', "%{$kw}%")
                   ->orWhere('package_code', 'like', "%{$kw}%");
            });
        }

        $q->orderBy('order_number')->orderBy('id');

        $perPage = (int)$request->query('per_page', 0);
        if ($perPage > 0) {
            $page = $q->paginate($perPage);
            return response()->json($page);
        }

        $rows = $q->get();
        return response()->json(['data' => $rows]);
    }

    /**
     * ADMIN (JWT) — detail paket.
     * GET /api/packages/{id}
     */
    public function show($id)
    {
        $row = ProductPackage::findOrFail($id);
        return response()->json(['data' => $row]);
    }

    /**
     * ADMIN (JWT) — create package.
     * POST /api/packages
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_code' => ['required', 'string'],
            'name'         => ['required', 'string', 'max:150'],
            'status'       => ['nullable', 'in:active,inactive'],
            'order_number' => ['nullable', 'integer'],
        ]);

        // Cari product_id bila ada product_code
        $product = Product::where('product_code', $validated['product_code'])->first();
        $payload = $request->only([
            'product_code',
            'product_id',
            'package_code',
            'name',
            'description',
            'status',
            'notes',
            'order_number',
        ]);

        if (!$payload['product_id'] && $product) {
            $payload['product_id'] = $product->id;
        }

        $payload['status'] = $payload['status'] ?? 'active';

        $row = ProductPackage::create($payload);

        return response()->json(['success' => true, 'data' => $row], 201);
    }

    /**
     * ADMIN (JWT) — update package.
     * PUT /api/packages/{id}
     */
    public function update(Request $request, $id)
    {
        $row = ProductPackage::findOrFail($id);

        $validated = $request->validate([
            'name'         => ['sometimes', 'required', 'string', 'max:150'],
            'status'       => ['nullable', 'in:active,inactive'],
            'order_number' => ['nullable', 'integer'],
        ]);

        $payload = $request->only([
            'product_code',
            'product_id',
            'package_code',
            'name',
            'description',
            'status',
            'notes',
            'order_number',
        ]);

        // Sinkronkan product_id jika product_code diubah
        if (!empty($payload['product_code'])) {
            $product = Product::where('product_code', $payload['product_code'])->first();
            if ($product) {
                $payload['product_id'] = $product->id;
            }
        }

        $row->fill($payload);
        $row->save();

        return response()->json(['success' => true, 'data' => $row]);
    }

    /**
     * ADMIN (JWT) — delete (soft delete).
     * DELETE /api/packages/{id}
     */
    public function destroy($id)
    {
        $row = ProductPackage::findOrFail($id);
        $row->delete();

        return response()->json(['success' => true]);
    }

    /**
     * ADMIN (JWT) — bulk upsert matrix paket untuk feature/menu.
     * POST /api/catalog/products/{codeOrId}/matrix/bulk
     * Body:
     * {
     *   "changes": [
     *     {"item_type":"feature|menu","item_id":"export-excel","package_id":123,"enabled":true},
     *     ...
     *   ]
     * }
     */
    public function saveMatrixBulk(Request $request, string $codeOrId)
    {
        $validated = $request->validate([
            'changes'                  => ['required', 'array', 'min:1'],
            'changes.*.item_type'      => ['required', 'in:feature,menu'],
            'changes.*.item_id'        => ['required', 'string'],
            'changes.*.package_id'     => ['required', 'integer'],
            'changes.*.enabled'        => ['required', 'boolean'],
        ]);

        $product = Product::where('product_code', $codeOrId)
            ->orWhere('id', $codeOrId)
            ->firstOrFail();

        $now = now()->toDateTimeString();

        // Validasi package milik product yang sama
        $pkgIds = collect($validated['changes'])->pluck('package_id')->unique()->values()->all();
        $validPkgs = ProductPackage::where('product_code', $product->product_code)
            ->whereIn('id', $pkgIds)
            ->pluck('id')
            ->all();

        $invalidPkg = array_diff($pkgIds, $validPkgs);
        if ($invalidPkg) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid package_id for this product: ' . implode(',', $invalidPkg),
            ], 422);
        }

        // Upsert ke tabel matrix (pastikan tabel & unique index sesuai)
        $rows = [];
        foreach ($validated['changes'] as $c) {
            $rows[] = [
                'product_code' => $product->product_code,
                'package_id'   => (int)$c['package_id'],
                'item_type'    => (string)$c['item_type'],
                'item_id'      => (string)$c['item_id'],
                'enabled'      => (bool)$c['enabled'],
                'updated_at'   => $now,
                'created_at'   => $now,
            ];
        }

        DB::table('mst_package_matrix')->upsert(
            $rows,
            ['product_code', 'package_id', 'item_type', 'item_id'],
            ['enabled', 'updated_at']
        );

        return response()->json(['success' => true, 'count' => count($rows)]);
    }

    /**
     * ADMIN (JWT) — toggle satu sel matrix.
     * POST /api/catalog/products/{codeOrId}/matrix/toggle
     * Body:
     * {
     *   "item_type":"feature|menu",
     *   "item_id":"export-excel",
     *   "package_id":123,
     *   "enabled":true
     * }
     */
    public function toggleCell(Request $request, string $codeOrId)
    {
        $validated = $request->validate([
            'item_type'  => ['required', 'in:feature,menu'],
            'item_id'    => ['required', 'string'],
            'package_id' => ['required', 'integer'],
            'enabled'    => ['required', 'boolean'],
        ]);

        $product = Product::where('product_code', $codeOrId)
            ->orWhere('id', $codeOrId)
            ->firstOrFail();

        $pkg = ProductPackage::where('product_code', $product->product_code)
            ->where('id', (int)$validated['package_id'])
            ->firstOrFail();

        $now = now()->toDateTimeString();

        DB::table('mst_package_matrix')->upsert(
            [[
                'product_code' => $product->product_code,
                'package_id'   => $pkg->id,
                'item_type'    => (string)$validated['item_type'],
                'item_id'      => (string)$validated['item_id'],
                'enabled'      => (bool)$validated['enabled'],
                'updated_at'   => $now,
                'created_at'   => $now,
            ]],
            ['product_code', 'package_id', 'item_type', 'item_id'],
            ['enabled', 'updated_at']
        );

        return response()->json(['success' => true]);
    }
}
