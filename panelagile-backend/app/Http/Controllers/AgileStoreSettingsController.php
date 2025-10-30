<?php

namespace App\Http\Controllers;

use App\Models\AgileStoreItem;
use App\Models\AgileStoreSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AgileStoreSettingsController extends Controller
{
    /** GET /api/agile-store/sections */
    public function index()
    {
        $sections = AgileStoreSection::with([
            'items.product',
            'items.package',
            'items.duration',
        ])->orderBy('order')->get();

        return response()->json(['data' => $sections]);
    }

    /** GET /api/agile-store/sections/{key} */
    public function show($key)
    {
        $section = AgileStoreSection::with(['items.product','items.package','items.duration'])
            ->where('key', $key)->firstOrFail();

        return response()->json(['data' => $section]);
    }

    /**
     * POST /api/agile-store/sections/upsert
     * Payload mengikuti state FE: { sections: [...] }
     * Sekarang mendukung bilingual:
     *  - Section: content (ID) & content_en (EN)
     *  - Items:   title/subtitle/description/cta_label (ID) & *_en (EN)
     */
    public function upsert(Request $request)
    {
        $payload = $request->validate([
            'sections' => ['required','array'],

            'sections.*.key'      => ['required','string', Rule::in([
                'hero','why','how','products','pricing','cta','testimonials','footer','about','contact'
            ])],
            'sections.*.name'     => ['required','string'],
            'sections.*.enabled'  => ['required','boolean'],
            'sections.*.order'    => ['required','integer'],
            'sections.*.theme'    => ['nullable','array'],

            // bilingual content
            'sections.*.content'     => ['nullable','array'], // ID (lokal)
            'sections.*.content_en'  => ['nullable','array'], // EN (dasar)

            // items bilingual
            'sections.*.items'    => ['nullable','array'],
            'sections.*.items.*.id'            => ['nullable','integer'],
            // ID (lokal)
            'sections.*.items.*.title'         => ['nullable','string'],
            'sections.*.items.*.subtitle'      => ['nullable','string'],
            'sections.*.items.*.description'   => ['nullable','string'],
            'sections.*.items.*.cta_label'     => ['nullable','string'],
            // EN (dasar)
            'sections.*.items.*.title_en'       => ['nullable','string'],
            'sections.*.items.*.subtitle_en'    => ['nullable','string'],
            'sections.*.items.*.description_en' => ['nullable','string'],
            'sections.*.items.*.cta_label_en'   => ['nullable','string'],

            'sections.*.items.*.order'         => ['nullable','integer'],
            'sections.*.items.*.product_code'  => ['nullable','string'],
            'sections.*.items.*.package_id'    => ['nullable','integer'],
            'sections.*.items.*.duration_id'   => ['nullable','integer'],
            'sections.*.items.*.price_monthly' => ['nullable','numeric'],
            'sections.*.items.*.price_yearly'  => ['nullable','numeric'],

            // extras (ID & EN)
            'sections.*.items.*.extras'        => ['nullable','array'],
            'sections.*.items.*.extras_en'     => ['nullable','array'],
        ]);

        $inferType = function(string $sectionKey) {
            return match ($sectionKey) {
                'products'     => 'product',
                'pricing'      => 'pricing',
                'testimonials' => 'testimonial',
                'why'          => 'feature',
                'how'          => 'step',
                'footer'       => 'link',
                default        => 'content',
            };
        };

        DB::transaction(function () use ($payload, $inferType) {
            foreach ($payload['sections'] as $sec) {
                /** @var AgileStoreSection $section */
                $section = AgileStoreSection::firstOrNew(['key' => $sec['key']]);

                // isi bilingual untuk section
                $section->fill([
                    'name'       => $sec['name'],
                    'enabled'    => $sec['enabled'],
                    'order'      => $sec['order'],
                    'theme'      => $sec['theme']      ?? null,
                    'content'    => $sec['content']    ?? null, // ID (lokal)
                    'content_en' => $sec['content_en'] ?? null, // EN (dasar)
                ]);
                $section->save();

                // Sync items (jika dikirim)
                if (array_key_exists('items', $sec)) {
                    $keepIds = [];
                    foreach ($sec['items'] as $raw) {
                        $item = isset($raw['id'])
                            ? AgileStoreItem::firstOrNew(['id' => $raw['id']])
                            : new AgileStoreItem();

                        $item->section_id   = $section->id;
                        $item->item_type    = $raw['item_type'] ?? $inferType($sec['key']);

                        // ===== Isi bilingual untuk item =====
                        // ID (lokal)
                        $item->title        = $raw['title']        ?? ($raw['name'] ?? null);
                        $item->subtitle     = $raw['subtitle']     ?? null;
                        $item->description  = $raw['description']  ?? null;
                        $item->cta_label    = $raw['cta_label']    ?? ($raw['cta'] ?? null);
                        // EN (dasar)
                        $item->title_en        = $raw['title_en']        ?? ($raw['name_en'] ?? null);
                        $item->subtitle_en     = $raw['subtitle_en']     ?? null;
                        $item->description_en  = $raw['description_en']  ?? null;
                        $item->cta_label_en    = $raw['cta_label_en']    ?? ($raw['cta_en'] ?? null);

                        $item->order        = $raw['order']        ?? 1;

                        // domain refs
                        $item->product_code = $raw['product_code'] ?? null;
                        $item->package_id   = $raw['package_id']   ?? null;
                        $item->duration_id  = $raw['duration_id']  ?? null;

                        // pricing overrides
                        $item->price_monthly = $raw['price_monthly'] ?? (data_get($raw, 'price.monthly'));
                        $item->price_yearly  = $raw['price_yearly']  ?? (data_get($raw, 'price.yearly'));

                        // ===== extras bilingual =====
                        $extrasId = $raw['extras'] ?? [];
                        $extrasEn = $raw['extras_en'] ?? [];

                        // Map khusus dari payload UI lama (ID)
                        if (isset($raw['name']) && $item->item_type === 'product') {
                            $extrasId['custom_name'] = $raw['name'];
                        }
                        if (isset($raw['quote']) && $item->item_type === 'testimonial') {
                            $extrasId['quote'] = $raw['quote'];
                        }
                        if (isset($raw['role']) && $item->item_type === 'testimonial') {
                            $extrasId['person_role'] = $raw['role'];
                        }
                        if (isset($raw['features']) && $item->item_type === 'pricing' && is_array($raw['features'])) {
                            $extrasId['features'] = $raw['features'];
                        }

                        // Map khusus (EN)
                        if (isset($raw['name_en']) && $item->item_type === 'product') {
                            $extrasEn['custom_name'] = $raw['name_en'];
                        }
                        if (isset($raw['quote_en']) && $item->item_type === 'testimonial') {
                            $extrasEn['quote'] = $raw['quote_en'];
                        }
                        if (isset($raw['role_en']) && $item->item_type === 'testimonial') {
                            $extrasEn['person_role'] = $raw['role_en'];
                        }
                        if (isset($raw['features_en']) && $item->item_type === 'pricing' && is_array($raw['features_en'])) {
                            $extrasEn['features'] = $raw['features_en'];
                        }

                        $item->extras    = $extrasId ?: null; // lokal/ID
                        $item->extras_en = $extrasEn ?: null; // EN

                        $item->save();
                        $keepIds[] = $item->id;
                    }

                    // hapus item yang tidak dikirim
                    AgileStoreItem::where('section_id', $section->id)
                        ->whereNotIn('id', $keepIds)->delete();
                }
            }
        });

        return response()->json(['status' => 'ok']);
    }
}
