<?php
// app/Http/Controllers/PricelistController.php
namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductPackage;
use App\Models\ProductPricelist;
use App\Models\ProductPricelistItem;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class PricelistController extends Controller
{
    public function show(string $codeOrId)
    {
        $product = Product::where('product_code',$codeOrId)->orWhere('id',$codeOrId)->first();
        if (!$product) return response()->json(['message'=>'Product not found'],404);

        $header = ProductPricelist::where('product_code',$product->product_code)->first();
        if (!$header) {
            return response()->json([
                'currency' => 'IDR',
                'tax_mode' => 'inclusive',
                'items'    => [],
            ]);
        }

        $items = $header->items()
            ->orderBy('duration_id')->orderBy('package_id')
            ->get()
            ->map(fn($r)=>[
                'package_id'       => (string)$r->package_id,
                'package_code'     => $r->package_code,
                'duration_id'      => (string)$r->duration_id,
                'duration_code'    => $r->duration_code,
                'price'            => (float)$r->price,
                'discount'         => (float)$r->discount,
                'min_billing_cycle'=> (int)$r->min_billing_cycle,
                'prorate'          => (bool)$r->prorate,
                'effective_start'  => $r->effective_start?->toDateString(),
                'effective_end'    => $r->effective_end?->toDateString(),
            ])->values();

        return response()->json([
            'currency' => $header->currency,
            'tax_mode' => $header->tax_mode,
            'items'    => $items,
        ]);
    }

    public function updateHeader(Request $req, string $codeOrId)
    {
        $validated = $req->validate([
            'currency' => ['required','string','size:3'],
            'tax_mode' => ['required', Rule::in(['inclusive','exclusive'])],
        ]);

        $product = Product::where('product_code',$codeOrId)->orWhere('id',$codeOrId)->first();
        if (!$product) return response()->json(['message'=>'Product not found'],404);

        $header = ProductPricelist::firstOrNew(['product_code'=>$product->product_code]);
        if (!$header->exists) {
            $header->id = (string) Str::uuid();
        }
        $header->product_id = $product->id;
        $header->currency   = strtoupper($validated['currency']);
        $header->tax_mode   = $validated['tax_mode'];
        $header->save();

        return response()->json([
            'message' => 'Pricelist header updated',
            'data'    => [
                'id'           => $header->id,
                'product_code' => $header->product_code,
                'currency'     => $header->currency,
                'tax_mode'     => $header->tax_mode,
            ],
        ]);
    }

    /**
     * POST /api/catalog/products/{codeOrId}/pricelist/bulk
     * Body: { currency, tax_mode, items: [...] }
     */
    public function bulkUpsert(string $codeOrId, Request $request)
    {
        $payload = $request->validate([
            'currency' => ['nullable','string','size:3'],
            'tax_mode' => ['nullable', Rule::in(['inclusive','exclusive'])],
            'items'   => ['required', 'array', 'min:1'],
            'items.*.package_id'        => ['required', 'integer'],
            'items.*.duration_id'       => ['required', 'integer'],
            'items.*.price'             => ['required', 'numeric', 'min:0'],
            'items.*.discount'          => ['nullable', 'numeric', 'min:0'],
            'items.*.min_billing_cycle' => ['nullable', 'integer', 'min:0'],
            'items.*.prorate'           => ['nullable', 'boolean'],
            'items.*.effective_start'   => ['nullable', 'date'],
            'items.*.effective_end'     => ['nullable', 'date', 'after_or_equal:items.*.effective_start'],
        ]);

        // 1) Temukan produk & header pricelist
        $product = Product::where('product_code',$codeOrId)->orWhere('id',$codeOrId)->first();
        if (!$product) return response()->json(['message'=>'Product not found'],404);

        $header = ProductPricelist::firstOrNew(['product_code'=>$product->product_code]);
        if (!$header->exists) {
            $header->id = (string) Str::uuid();
        }
        // jika FE ikut kirim currency/tax_mode, sinkronkan sekalian
        if (!empty($payload['currency'])) $header->currency = strtoupper($payload['currency']);
        if (!empty($payload['tax_mode'])) $header->tax_mode = $payload['tax_mode'];
        $header->product_id = $product->id;
        $header->save();

        // 2) Siapkan map kode paket & durasi (opsional)
        $packageIds = collect($payload['items'])->pluck('package_id')->unique()->values();
        $packages   = ProductPackage::whereIn('id', $packageIds)->get(['id','package_code']);
        $pkgCodeMap = $packages->pluck('package_code', 'id'); // id => code

        $durationIds = collect($payload['items'])->pluck('duration_id')->unique()->values();
        $durCodeMap  = $durationIds->mapWithKeys(fn($id) => [$id => "DUR-{$id}"]);

        $now  = now();
        $rows = [];

        foreach ($payload['items'] as $it) {
            $pid = (int) $it['package_id'];
            $did = (int) $it['duration_id'];

            $rows[] = [
                'id'                => (string) Str::uuid(),     // untuk insert
                'pricelist_id'      => (string) $header->id,     // <<< PENTING: pakai UUID header
                'package_id'        => $pid,
                'package_code'      => (string) ($pkgCodeMap[$pid] ?? ''),
                'duration_id'       => $did,
                'duration_code'     => (string) ($durCodeMap[$did] ?? ''),
                'price'             => (float) ($it['price'] ?? 0),
                'discount'          => (float) ($it['discount'] ?? 0),
                'min_billing_cycle' => (int)   ($it['min_billing_cycle'] ?? 0),
                'prorate'           => (bool)  ($it['prorate'] ?? false),
                'effective_start'   => !empty($it['effective_start']) ? Carbon::parse($it['effective_start'])->toDateTimeString() : null,
                'effective_end'     => !empty($it['effective_end'])   ? Carbon::parse($it['effective_end'])->toDateTimeString()   : null,
                'created_at'        => $now,
                'updated_at'        => $now,
            ];
        }

        DB::transaction(function () use ($rows) {
            ProductPricelistItem::upsert(
                $rows,
                ['pricelist_id','package_id','duration_id'], // uniqueBy
                [
                    'price','discount','min_billing_cycle','prorate',
                    'effective_start','effective_end',
                    'package_code','duration_code','updated_at'
                ]
            );
        });

        return response()->json([
            'message' => 'Pricelist items upserted.',
            'pricelist_id' => $header->id,
            'count'   => count($rows),
        ]);
    }
}
