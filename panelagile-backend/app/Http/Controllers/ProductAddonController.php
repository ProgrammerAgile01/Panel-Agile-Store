<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductAddon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductAddonController extends Controller
{
    /**
     * PUBLIC/ADMIN — daftar addons per product (default hanya active).
     * GET /api/mst-addons/by-product/{codeOrId}?include_inactive=1
     */
    public function listByProduct(Request $request, string $codeOrId)
    {
        $includeInactive = (int) $request->query('include_inactive', 0) === 1;

        $q = ProductAddon::query()
            ->where(function ($qq) use ($codeOrId) {
                $qq->where('product_code', $codeOrId);
                if (is_numeric($codeOrId)) {
                    $qq->orWhere('product_id', (int) $codeOrId);
                }
            });

        if (!$includeInactive) {
            $q->where('status', 'active');
        }

        $rows = $q->orderBy('order_number')
                  ->orderBy('id')
                  ->get();

        return response()->json(['data' => $rows]);
    }

    /**
     * ADMIN — index dengan filter.
     * GET /api/mst-addons?product_code=&status=&kind=&q=&per_page=
     */
    public function index(Request $request)
    {
        $q = ProductAddon::query();

        if ($pc = $request->query('product_code')) {
            $q->where('product_code', $pc);
        }
        if ($st = $request->query('status')) {
            $q->where('status', $st);
        }
        if ($kd = $request->query('kind')) {
            $q->where('kind', $kd);
        }
        if ($kw = trim((string) $request->query('q', ''))) {
            $q->where(function ($qq) use ($kw) {
                $qq->where('name', 'like', "%{$kw}%")
                   ->orWhere('addon_code', 'like', "%{$kw}%")
                   ->orWhere('description', 'like', "%{$kw}%")
                   ->orWhere('notes', 'like', "%{$kw}%");
            });
        }

        $q->orderBy('order_number')->orderBy('id');

        $perPage = (int) $request->query('per_page', 0);
        if ($perPage > 0) {
            $page = $q->paginate($perPage);
            return response()->json($page);
        }

        return response()->json(['data' => $q->get()]);
    }

    /**
     * ADMIN — detail.
     * GET /api/mst-addons/{id}
     */
    public function show($id)
    {
        $row = ProductAddon::findOrFail($id);
        return response()->json(['data' => $row]);
    }

    /**
     * ADMIN — create.
     * POST /api/mst-addons
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_code' => ['required', 'string', 'max:150'],
            'name'         => ['required', 'string', 'max:150'],
            'addon_code'   => ['nullable', 'string', 'max:150'],
            'description'  => ['nullable', 'string'],

            'kind'         => ['nullable', 'in:quantity,toggle'],
            'pricing_mode' => ['nullable', 'in:per_unit_per_cycle,one_time'],

            'unit_label'   => ['nullable', 'string', 'max:60'],
            'min_qty'      => ['nullable', 'integer', 'min:0'],
            'step_qty'     => ['nullable', 'integer', 'min:1'],
            'max_qty'      => ['nullable', 'integer', 'min:1'],

            'currency'     => ['nullable', 'string', 'max:10'],
            'unit_price'   => ['nullable', 'integer', 'min:0'],

            'status'       => ['nullable', 'in:active,inactive'],
            'order_number' => ['nullable', 'integer'],
            'notes'        => ['nullable', 'string'],
        ]);

        $product = Product::where('product_code', $validated['product_code'])->firstOrFail();

        // kode
        $incoming = trim((string)($request->input('addon_code') ?? ''));
        if ($incoming === '') {
            $incoming = Str::slug($validated['name']);
        }
        $addonCode = $this->ensureUniqueAddonCode($product->product_code, $incoming);

        $payload = [
            'product_id'   => $product->id,
            'product_code' => $product->product_code,

            'addon_code'   => $addonCode,
            'name'         => $validated['name'],
            'description'  => $request->input('description'),

            'kind'         => $request->input('kind', 'quantity'),
            'pricing_mode' => $request->input('pricing_mode', 'per_unit_per_cycle'),

            'unit_label'   => $request->input('unit_label', 'unit'),
            'min_qty'      => (int) $request->input('min_qty', 1),
            'step_qty'     => (int) $request->input('step_qty', 1),
            'max_qty'      => $request->input('max_qty') !== null ? (int)$request->input('max_qty') : null,

            'currency'     => $request->input('currency', 'IDR'),
            'unit_price'   => (int) $request->input('unit_price', 0),

            'status'       => $request->input('status', 'active'),
            'order_number' => $request->filled('order_number')
                                ? (int)$request->input('order_number')
                                : ((int) (ProductAddon::where('product_code', $product->product_code)->max('order_number') ?? 0) + 1),
            'notes'        => $request->input('notes'),
        ];

        // Normalisasi untuk toggle
        if ($payload['kind'] === 'toggle') {
            $payload['min_qty']  = 0;
            $payload['step_qty'] = 1;
            $payload['max_qty']  = 1;
            $payload['unit_label'] = $payload['unit_label'] ?? 'toggle';
        }

        $row = ProductAddon::create($payload);
        return response()->json(['success' => true, 'data' => $row], 201);
    }

    /**
     * ADMIN — update.
     * PUT /api/mst-addons/{id}
     */
    public function update(Request $request, $id)
    {
        $row = ProductAddon::findOrFail($id);

        $validated = $request->validate([
            'product_code' => ['nullable', 'string', 'max:150'],
            'name'         => ['sometimes', 'required', 'string', 'max:150'],
            'addon_code'   => ['nullable', 'string', 'max:150'],
            'description'  => ['nullable', 'string'],

            'kind'         => ['nullable', 'in:quantity,toggle'],
            'pricing_mode' => ['nullable', 'in:per_unit_per_cycle,one_time'],

            'unit_label'   => ['nullable', 'string', 'max:60'],
            'min_qty'      => ['nullable', 'integer', 'min:0'],
            'step_qty'     => ['nullable', 'integer', 'min:1'],
            'max_qty'      => ['nullable', 'integer', 'min:1'],

            'currency'     => ['nullable', 'string', 'max:10'],
            'unit_price'   => ['nullable', 'integer', 'min:0'],

            'status'       => ['nullable', 'in:active,inactive'],
            'order_number' => ['nullable', 'integer'],
            'notes'        => ['nullable', 'string'],
        ]);

        // Jika product_code berubah → sinkronkan product_id
        if ($request->filled('product_code')) {
            $product = Product::where('product_code', $request->input('product_code'))->firstOrFail();
            $row->product_code = $product->product_code;
            $row->product_id   = $product->id;
        }

        // addon_code unik per product_code
        if ($request->filled('addon_code')) {
            $incoming = trim((string)$request->input('addon_code'));
            if ($incoming === '') {
                $incoming = Str::slug($request->input('name', $row->name));
            }
            $row->addon_code = $this->ensureUniqueAddonCode($row->product_code, $incoming, $row->id);
        }

        // isi lain
        $row->fill($request->only([
            'name','description','kind','pricing_mode','unit_label',
            'min_qty','step_qty','max_qty','currency','unit_price',
            'status','order_number','notes'
        ]));

        // Normalisasi toggle
        if ($row->kind === 'toggle') {
            $row->min_qty = 0;
            $row->step_qty = 1;
            $row->max_qty = 1;
            $row->unit_label = $row->unit_label ?: 'toggle';
        }

        // Default order_number bila kosong
        if (!$request->filled('order_number') && $row->order_number === null) {
            $row->order_number = (int) (ProductAddon::where('product_code', $row->product_code)->max('order_number') ?? 0) + 1;
        }

        $row->save();

        return response()->json(['success' => true, 'data' => $row]);
    }

    /**
     * ADMIN — soft delete.
     * DELETE /api/mst-addons/{id}
     */
    public function destroy($id)
    {
        $row = ProductAddon::findOrFail($id);
        $row->delete();
        return response()->json(['success' => true]);
    }

    /**
     * Unik-ifier untuk addon_code per product_code.
     */
    private function ensureUniqueAddonCode(string $productCode, string $baseCode, ?int $ignoreId = null): string
    {
        $slug = Str::slug($baseCode);
        if ($slug === '') $slug = 'addon';

        $candidate = $slug;
        $i = 2;

        while (
            ProductAddon::where('product_code', $productCode)
                ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
                ->where('addon_code', $candidate)
                ->exists()
        ) {
            $candidate = $slug.'-'.$i;
            $i++;
        }
        return $candidate;
    }
}