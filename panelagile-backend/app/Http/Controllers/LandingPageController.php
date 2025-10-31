<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\LandingPage;
use App\Models\LandingPageSection;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class LandingPageController extends Controller
{
    /** Helper: cari product by code atau id */
    protected function findProduct(string $codeOrId): ?Product
    {
        return Product::query()
            ->where('product_code', $codeOrId)
            ->orWhere('id', $codeOrId)
            ->first();
    }

    /**
     * GET /catalog/products/{codeOrId}/landing
     * Public — kembalikan struktur { product, page, sections[] }
     */
    public function show(Request $req, string $codeOrId)
    {
        $product = $this->findProduct($codeOrId);
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $page = LandingPage::where('product_code', $product->product_code)->first();

        // Jika page belum ada, kirimkan stub tanpa menyimpan sections
        if (!$page) {
            $page = new LandingPage([
                'id'           => (string) \Illuminate\Support\Str::uuid(),
                'product_code' => $product->product_code,
                'status'       => 'draft',
                'meta'         => null,
            ]);
        }

        $sections = $page->exists
            ? $page->sections()->orderBy('display_order')->get()
            : collect();

        // NB: model LandingPageSection sebaiknya punya:
        // protected $casts = ['content' => 'array', 'content_en' => 'array'];
        return response()->json([
            'data' => [
                'product'  => [
                    'id'           => $product->id,
                    'product_code' => $product->product_code,
                    'product_name' => $product->product_name,
                    'status'       => $product->status,
                ],
                'page'     => $page,
                'sections' => $sections,
            ],
        ]);
    }

    /**
     * PUT /catalog/products/{codeOrId}/landing
     * JWT — simpan header (status/meta) & bulk sections.
     *
     * Body:
     * {
     *   "status": "draft|published",
     *   "meta": {...} (optional),
     *   "sections": [
     *     {
     *       "id"?: string,
     *       "section_key": "hero",
     *       "name": "Hero Section",
     *       "enabled": true,
     *       "display_order": 1,
     *       "content": {...},        // ID (opsional; JANGAN dihapus bila tidak dikirim)
     *       "content_en": {...}      // EN (opsional; JANGAN dihapus bila tidak dikirim)
     *     },
     *     ...
     *   ]
     * }
     */
    public function upsert(Request $req, string $codeOrId)
    {
        $product = $this->findProduct($codeOrId);
        if (!$product) return response()->json(['message' => 'Product not found'], 404);

        $data = $req->validate([
            'status'   => ['nullable', Rule::in(['draft','published'])],
            'meta'     => ['nullable','array'],

            'sections'                   => ['required','array','min:1'],
            'sections.*.id'              => ['nullable','string'],
            'sections.*.section_key'     => ['required','string','max:64'],
            'sections.*.name'            => ['required','string','max:255'],
            'sections.*.enabled'         => ['required','boolean'],
            'sections.*.display_order'   => ['required','integer','min:0'],
            'sections.*.content'         => ['sometimes','nullable','array'],
            'sections.*.content_en'      => ['sometimes','nullable','array'],
        ]);

        return DB::transaction(function () use ($product, $data, $req) {
            $page = LandingPage::firstOrCreate(
                ['product_code' => $product->product_code],
                ['status' => 'draft', 'meta' => null]
            );

            if (Arr::has($data, 'status')) $page->status = $data['status'];
            if (Arr::has($data, 'meta'))   $page->meta   = $data['meta'];
            $page->save();

            $keepIds = [];

            foreach ($data['sections'] as $row) {
                // unique by (page, section_key)
                $sec = LandingPageSection::where('landing_page_id', $page->id)
                    ->where('section_key', $row['section_key'])
                    ->first();

                if (!$sec) {
                    $sec = new LandingPageSection([
                        'landing_page_id' => $page->id,
                        'section_key'     => $row['section_key'],
                    ]);
                }

                $sec->name          = $row['name'];
                $sec->enabled       = (bool) $row['enabled'];
                $sec->display_order = (int) $row['display_order'];

                // ⛑️ PENTING: Hanya set field bila key ada di payload.
                // Ini mencegah konten lama terhapus jadi NULL ketika klien hanya mengupdate bahasa lain.
                if (array_key_exists('content', $row)) {
                    $sec->content = $row['content']; // boleh null/array sesuai validasi
                }
                if (array_key_exists('content_en', $row)) {
                    $sec->content_en = $row['content_en']; // boleh null/array sesuai validasi
                }

                // (Opsional) Fail-safe: kalau primary language ID dan content kosong namun content_en ada,
                // ANDA BISA mengaktifkan mirror berikut untuk menghindari halaman kosong.
                // if (!$sec->content && $sec->content_en && $req->boolean('mirror_en_to_id_when_empty', false)) {
                //     $sec->content = $sec->content_en;
                // }

                $sec->save();
                $keepIds[] = $sec->id;
            }

            // hapus section yang tidak ada di payload (soft delete)
            LandingPageSection::where('landing_page_id', $page->id)
                ->whereNotIn('id', $keepIds)
                ->delete();

            return response()->json([
                'success' => true,
                'data'    => [
                    'page'     => $page->fresh(),
                    'sections' => $page->sections()->orderBy('display_order')->get(),
                ],
                'message' => 'Landing saved',
            ]);
        });
    }

    /**
     * PATCH /catalog/products/{codeOrId}/landing/sections/{sectionId}
     * JWT — update parsial satu section
     */
    public function updateSection(Request $req, string $codeOrId, string $sectionId)
    {
        $product = $this->findProduct($codeOrId);
        if (!$product) return response()->json(['message' => 'Product not found'], 404);

        $page = LandingPage::where('product_code', $product->product_code)->first();
        if (!$page) return response()->json(['message' => 'Landing page not found'], 404);

        $section = LandingPageSection::where('landing_page_id', $page->id)
            ->where('id', $sectionId)
            ->first();
        if (!$section) return response()->json(['message' => 'Section not found'], 404);

        $data = $req->validate([
            'name'          => ['sometimes','string','max:255'],
            'enabled'       => ['sometimes','boolean'],
            'display_order' => ['sometimes','integer','min:0'],
            'content'       => ['sometimes','nullable','array'],
            'content_en'    => ['sometimes','nullable','array'],
        ]);

        // Hanya fill keys yang dikirim (hindari overwrite ke null)
        foreach ($data as $k => $v) {
            $section->{$k} = $v;
        }
        $section->save();

        return response()->json(['success' => true, 'data' => $section]);
    }

    /**
     * DELETE /catalog/products/{codeOrId}/landing/sections/{sectionId}
     * JWT — hapus satu section
     */
    public function destroySection(Request $req, string $codeOrId, string $sectionId)
    {
        $product = $this->findProduct($codeOrId);
        if (!$product) return response()->json(['message' => 'Product not found'], 404);

        $page = LandingPage::where('product_code', $product->product_code)->first();
        if (!$page) return response()->json(['message' => 'Landing page not found'], 404);

        $section = LandingPageSection::where('landing_page_id', $page->id)
            ->where('id', $sectionId)
            ->first();
        if (!$section) return response()->json(['message' => 'Section not found'], 404);

        $section->delete();

        return response()->json(['success' => true]);
    }
}
