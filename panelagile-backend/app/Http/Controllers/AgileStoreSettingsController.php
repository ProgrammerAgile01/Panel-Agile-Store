<?php

namespace App\Http\Controllers;

use App\Models\AgileStoreItem;
use App\Models\AgileStoreSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AgileStoreSettingsController extends Controller
{
    /**
     * GET /api/agile-store/sections
     * Ambil semua section + items.
     */
    public function index()
    {
        $sections = AgileStoreSection::with([
            'items.product',
            'items.package',
            'items.duration',
        ])->orderBy('order')->get();

        return response()->json(['data' => $sections]);
    }

    /**
     * GET /api/agile-store/sections/{key}
     */
    public function show($key)
    {
        $section = AgileStoreSection::with(['items.product','items.package','items.duration'])
            ->where('key', $key)->firstOrFail();

        return response()->json(['data' => $section]);
    }

    /**
     * POST /api/agile-store/sections/upsert
     * Payload mengikuti state frontend: { sections: [...] }
     * Items pada FE tidak punya type → kita infer dari key section.
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
            'sections.*.content'  => ['nullable','array'],

            // optional items (array bebas, controller akan map field)
            'sections.*.items'    => ['nullable','array'],
            'sections.*.items.*.id'            => ['nullable','integer'],
            'sections.*.items.*.title'         => ['nullable','string'],
            'sections.*.items.*.subtitle'      => ['nullable','string'],
            'sections.*.items.*.description'   => ['nullable','string'],
            'sections.*.items.*.cta_label'     => ['nullable','string'],
            'sections.*.items.*.order'         => ['nullable','integer'],
            'sections.*.items.*.product_code'  => ['nullable','string'],
            'sections.*.items.*.package_id'    => ['nullable','integer'],
            'sections.*.items.*.duration_id'   => ['nullable','integer'],
            'sections.*.items.*.price_monthly' => ['nullable','numeric'],
            'sections.*.items.*.price_yearly'  => ['nullable','numeric'],
            'sections.*.items.*.extras'        => ['nullable','array'],
        ]);

        $inferType = function(string $sectionKey) {
            return match ($sectionKey) {
                'products'     => 'product',
                'pricing'      => 'pricing',
                'testimonials' => 'testimonial',
                'why'          => 'feature',
                'how'          => 'step',
                'footer'       => 'link',   // link/quicklink dll
                default        => 'content',// hero/about/contact/cta dsb jika punya items
            };
        };

        DB::transaction(function () use ($payload, $inferType) {
            foreach ($payload['sections'] as $sec) {
                /** @var AgileStoreSection $section */
                $section = AgileStoreSection::firstOrNew(['key' => $sec['key']]);
                $section->fill([
                    'name'    => $sec['name'],
                    'enabled' => $sec['enabled'],
                    'order'   => $sec['order'],
                    'theme'   => $sec['theme']   ?? null,
                    'content' => $sec['content'] ?? null,
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
                        $item->title        = $raw['title']        ?? ($raw['name'] ?? null);
                        $item->subtitle     = $raw['subtitle']     ?? null;
                        $item->description  = $raw['description']  ?? null;
                        $item->cta_label    = $raw['cta_label']    ?? ($raw['cta'] ?? null);
                        $item->order        = $raw['order']        ?? 1;

                        // domain refs
                        $item->product_code = $raw['product_code'] ?? null;
                        $item->package_id   = $raw['package_id']   ?? null;
                        $item->duration_id  = $raw['duration_id']  ?? null;

                        // pricing overrides
                        $item->price_monthly = $raw['price_monthly'] ?? (data_get($raw, 'price.monthly'));
                        $item->price_yearly  = $raw['price_yearly']  ?? (data_get($raw, 'price.yearly'));

                        // extras:
                        // - testimonials: { person_name, person_role }
                        // - pricing.features: array of string
                        // - footer.link: { href, label }
                        // - products: { custom_name, custom_description }
                        $extras = $raw['extras'] ?? [];
                        // Map khusus dari payload UI lama:
                        if (isset($raw['name']) && $item->item_type === 'product') {
                            $extras['custom_name'] = $raw['name'];
                        }
                        if (isset($raw['quote']) && $item->item_type === 'testimonial') {
                            $extras['quote'] = $raw['quote'];
                        }
                        if (isset($raw['role']) && $item->item_type === 'testimonial') {
                            $extras['person_role'] = $raw['role'];
                        }
                        if (isset($raw['features']) && $item->item_type === 'pricing' && is_array($raw['features'])) {
                            $extras['features'] = $raw['features'];
                        }
                        $item->extras = $extras ?: null;

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
