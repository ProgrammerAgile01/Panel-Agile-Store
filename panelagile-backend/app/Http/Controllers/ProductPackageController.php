<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ProductPackage;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductPackageController extends Controller
{
    /**
     * GET /api/packages
     * Query:
     * - product_code=RENTVIX (disarankan)
     * - product_id=uuid
     * - status=active|inactive
     * - q=keyword (name/description/notes)
     * - per_page=200  (default 50, jika per_page=0 -> all)
     */
    public function index(Request $req)
    {
        $q = ProductPackage::query();

        if ($pc = $req->query('product_code')) {
            $q->where('product_code', $pc);
        }
        if ($pid = $req->query('product_id')) {
            $q->where('product_id', $pid);
        }
        if ($st = $req->query('status')) {
            $q->where('status', $st);
        }
        if ($search = trim((string) $req->query('q', ''))) {
            $q->where(function ($w) use ($search) {
                $w->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhere('package_code', 'like', "%{$search}%");
            });
        }

        $q->orderBy('order_number')->orderBy('id');

        $perPage = (int) $req->query('per_page', 50);
        if ($perPage === 0) {
            $rows = $q->get();
        } else {
            $rows = $q->paginate($perPage);
        }

        return response()->json([
            'success' => true,
            'data'    => $rows,
        ]);
    }

    /**
     * GET /api/packages/{id}
     */
    public function show($id)
    {
        $row = ProductPackage::findOrFail($id);
        return response()->json(['success' => true, 'data' => $row]);
    }

    /**
     * POST /api/packages
     * Body:
     * - product_code (required)
     * - product_id (optional)
     * - name (required)
     * - package_code (optional -> auto slug dari name jika kosong)
     * - description, notes (optional)
     * - status (active|inactive, default active)
     * - order_number (int)
     */
    public function store(Request $req)
    {
        $data = $req->validate([
            'product_code' => ['required', 'string', 'max:50'],
            'product_id'   => ['nullable', 'string', 'max:36'],
            'name'         => ['required', 'string', 'max:120'],
            'package_code' => ['nullable', 'string', 'max:60'],
            'description'  => ['nullable', 'string'],
            'notes'        => ['nullable', 'string'],
            'status'       => ['nullable', Rule::in(['active', 'inactive'])],
            'order_number' => ['nullable', 'integer', 'min:0'],
        ]);

        // default/auto
        if (empty($data['status'])) {
            $data['status'] = 'active';
        }
        if (empty($data['package_code'])) {
            $data['package_code'] = Str::slug($data['name']);
        } else {
            $data['package_code'] = Str::slug($data['package_code']);
        }
        if (!isset($data['order_number'])) {
            $data['order_number'] = 0;
        }

        // pastikan unik per (product_code, package_code)
        $exists = ProductPackage::where('product_code', $data['product_code'])
            ->where('package_code', $data['package_code'])
            ->exists();
        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => "Package code '{$data['package_code']}' already exists for product {$data['product_code']}",
            ], 422);
        }

        $row = ProductPackage::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Package created',
            'data'    => $row,
        ], 201);
    }

    /**
     * PUT /api/packages/{id}
     */
    public function update(Request $req, $id)
    {
        $row = ProductPackage::findOrFail($id);

        $data = $req->validate([
            'product_code' => ['sometimes', 'string', 'max:50'],
            'product_id'   => ['nullable', 'string', 'max:36'],
            'name'         => ['sometimes', 'string', 'max:120'],
            'package_code' => ['nullable', 'string', 'max:60'],
            'description'  => ['nullable', 'string'],
            'notes'        => ['nullable', 'string'],
            'status'       => ['nullable', Rule::in(['active', 'inactive'])],
            'order_number' => ['nullable', 'integer', 'min:0'],
        ]);

        // handle slug
        if (array_key_exists('package_code', $data)) {
            if (empty($data['package_code'])) {
                // jika dikosongkan, generate dari name (atau dari existing name)
                $data['package_code'] = Str::slug($data['name'] ?? $row->name);
            } else {
                $data['package_code'] = Str::slug($data['package_code']);
            }
        }

        // cek unik (product_code, package_code) saat berubah
        $pc = $data['product_code'] ?? $row->product_code;
        $pcc= $data['package_code'] ?? $row->package_code;
        $dupe = ProductPackage::where('product_code', $pc)
            ->where('package_code', $pcc)
            ->where('id', '!=', $row->id)
            ->exists();
        if ($dupe) {
            return response()->json([
                'success' => false,
                'message' => "Package code '{$pcc}' already exists for product {$pc}",
            ], 422);
        }

        $row->fill($data)->save();

        return response()->json([
            'success' => true,
            'message' => 'Package updated',
            'data'    => $row,
        ]);
    }

    /**
     * DELETE /api/packages/{id}
     */
    public function destroy($id)
    {
        $row = ProductPackage::findOrFail($id);
        $row->delete();

        return response()->json([
            'success' => true,
            'message' => 'Package deleted',
        ]);
    }

    /**
     * GET /api/catalog/products/{codeOrId}/packages
     * Public: list paket untuk product (default hanya active).
     * Query:
     * - include_inactive=1  (opsional)
     */
    public function listByProduct(Request $req, $codeOrId)
    {
        $q = ProductPackage::query()
            ->where(function ($w) use ($codeOrId) {
                // codeOrId bisa product_code ATAU product_id
                $w->where('product_code', $codeOrId)
                  ->orWhere('product_id', $codeOrId);
            });

        if (!$req->boolean('include_inactive')) {
            $q->where('status', 'active');
        }

        $rows = $q->orderBy('order_number')->orderBy('id')->get();

        return response()->json([
            'success' => true,
            'data'    => $rows,
        ]);
    }
}
