<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\BladeReportExport;

class UniversalExportController extends Controller
{
    /**
     * Registry resource yang diizinkan diexport.
     * Tambahkan resource baru cukup di array ini.
     *
     * - model     : class model Eloquent
     * - select    : kolom default untuk query
     * - defaults  : default columns untuk header Excel (label + key)
     * - search_in : daftar kolom untuk pencarian simple (filters.search)
     */
    protected array $registry = [
        'level_users' => [
            'model' => \App\Models\LevelUser::class,
            'select' => ['id', 'nama_level', 'deskripsi', 'status', 'default_homepage', 'updated_at'],
            'defaults' => [
                ['label' => 'Level', 'key' => 'nama_level'],
                ['label' => 'Description', 'key' => 'deskripsi'],
                ['label' => 'Status', 'key' => 'status'],
                ['label' => 'Homepage', 'key' => 'default_homepage'],
                ['label' => 'Updated At', 'key' => 'updated_at'],
            ],
            'search_in' => ['nama_level', 'deskripsi'],
        ],
        'vehicles' => [
            'model' => \App\Models\Vehicle::class, // ganti sesuai model kamu
            'select' => ['model', 'plate_number', 'year', 'color', 'location', 'vehicle_type', 'status', 'daily_rate'],
            'defaults' => [
                ['label' => 'Model', 'key' => 'model'],
                ['label' => 'Plate Number', 'key' => 'plate_number'],
                ['label' => 'Year', 'key' => 'year'],
                ['label' => 'Color', 'key' => 'color'],
                ['label' => 'Location', 'key' => 'location'],
                ['label' => 'Vehicle Type', 'key' => 'vehicle_type'],
                ['label' => 'Status', 'key' => 'status'],
                ['label' => 'Daily Rate', 'key' => 'daily_rate', 'format' => '#,##0'],
            ],
            'search_in' => ['model', 'plate_number', 'color', 'location', 'vehicle_type', 'status'],
        ],
        'nav_items' => [
            'model' => \App\Models\NavItem::class, // ganti sesuai model kamu
            'select' => ['id', 'group', 'name', 'path', 'description', 'order_number', 'updated_at'],
            'defaults' => [
                ['label' => 'Group', 'key' => 'group'],
                ['label' => 'Name', 'key' => 'name'],
                ['label' => 'Path', 'key' => 'path'],
                ['label' => 'Description', 'key' => 'description'],
                ['label' => 'Order', 'key' => 'order_number'],
                ['label' => 'Updated At', 'key' => 'updated_at'],
            ],
            'search_in' => ['group', 'name', 'path', 'description'],
        ],
    ];

    /**
     * Endpoint universal export (GET atau POST).
     *
     * Query/body:
     * - resource   : string (wajib) -> kunci pada $registry
     * - filename   : string (opsional)
     * - columns    : array [{label,key,format?}] (opsional -> pakai default bila kosong)
     * - select     : array kolom untuk query (opsional -> default dari registry)
     * - filters    : array (opsional) contoh: {"status":"Aktif","search":"marketing","date_from":"2025-01-01","date_to":"2025-12-31"}
     * - order      : array [{col:"updated_at",dir:"desc"}] (opsional)
     * - meta       : array meta header (opsional)
     * - summary    : array ringkasan (opsional)
     * - logo_path  : string path logo relatif public/ (default assets/logo/agile-store.png)
     */
    public function export(Request $request)
    {
        // --- 1) Ambil dan validasi resource
        $resource = $request->input('resource');
        if (!$resource || !isset($this->registry[$resource])) {
            return response()->json(['message' => "Resource tidak dikenali: {$resource}"], 422);
        }
        $conf = $this->registry[$resource];

        // --- 2) Parse payload (boleh JSON string atau array)
        $columns = $this->asArray($request->input('columns', []));
        $filters = $this->asArray($request->input('filters', []));
        $order = $this->asArray($request->input('order', []));
        $select = $this->asArray($request->input('select', []));
        $meta = $this->asArray($request->input('meta', []));
        $summary = $this->asArray($request->input('summary', []));
        $filename = $request->input('filename');
        $logoPath = $request->input('logo_path', 'assets/logo/agile-store.png');

        // default columns jika user tidak kirim
        if (empty($columns)) {
            $columns = $conf['defaults'];
        }

        // --- 3) Build query
        /** @var \Illuminate\Database\Eloquent\Builder $qb */
        $modelClass = $conf['model'];
        $qb = $modelClass::query();

        // select default/override
        $qb->select(!empty($select) ? $select : $conf['select']);

        // filters sederhana: equals untuk key tertentu
        if (!empty($filters)) {
            // search general
            if (!empty($filters['search']) && !empty($conf['search_in'])) {
                $s = $filters['search'];
                $qb->where(function (Builder $q) use ($s, $conf) {
                    foreach ($conf['search_in'] as $col) {
                        $q->orWhere($col, 'like', "%{$s}%");
                    }
                });
            }
            // equals map (kecuali key khusus)
            foreach ($filters as $k => $v) {
                if (in_array($k, ['search', 'date_from', 'date_to']) || $v === null || $v === '')
                    continue;
                $qb->where($k, $v);
            }
            // date range di updated_at / created_at (pakai yang ada)
            $dateColumn = $this->inferDateColumn($qb);
            if (!empty($filters['date_from'])) {
                $qb->whereDate($dateColumn, '>=', $filters['date_from']);
            }
            if (!empty($filters['date_to'])) {
                $qb->whereDate($dateColumn, '<=', $filters['date_to']);
            }
        }

        // order
        if (!empty($order)) {
            foreach ($order as $o) {
                $col = Arr::get($o, 'col');
                $dir = strtolower(Arr::get($o, 'dir', 'asc')) === 'desc' ? 'desc' : 'asc';
                if ($col)
                    $qb->orderBy($col, $dir);
            }
        } else {
            // fallback: updated_at desc bila ada
            $dateCol = $this->inferDateColumn($qb, false);
            if ($dateCol)
                $qb->orderBy($dateCol, 'desc');
        }

        // --- 4) Eksekusi query & bentuk rows sesuai columns[]
        $items = $qb->get();
        $rows = $items->map(function ($item) use ($columns) {
            $arr = [];
            foreach ($columns as $col) {
                $key = Arr::get($col, 'key');
                $arr[$key] = data_get($item, $key);
            }
            return $arr;
        })->toArray();

        // --- 5) Meta default + override
        $meta = array_merge([
            'company_name' => config('app.name', 'AGILE STORE'),
            'report_title' => Str::headline(str_replace('_', ' ', $resource)) . ' - Export',
            'generated_at' => now()->translatedFormat('d F Y H:i'),
            'exported_by' => optional($request->user())->name ?? 'Unknown User',
            'exported_at' => now()->translatedFormat('d F Y H:i'),
            'location_date' => now()->translatedFormat('d F Y'),
            'approved_by' => '',
        ], $meta);

        // --- 6) Nama file
        $finalName = $filename ?: ($resource . '.xlsx');

        // --- 7) Export
        $export = new BladeReportExport([
            'meta' => $meta,
            'columns' => $columns,
            'rows' => $rows,
            'summary' => $summary,
            'logo_path' => $logoPath,
        ]);

        return Excel::download($export, $finalName);
    }

    /** JSON string -> array */
    private function asArray($value): array
    {
        if (is_array($value))
            return $value;
        if (is_string($value)) {
            $json = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($json))
                return $json;
        }
        return [];
    }

    /** Coba tebak kolom tanggal untuk sorting/filter (updated_at -> created_at) */
    private function inferDateColumn(Builder $qb, bool $preferUpdated = true): string
    {
        $table = $qb->getModel()->getTable();
        $cols = \Schema::getColumnListing($table);
        if ($preferUpdated && in_array('updated_at', $cols))
            return 'updated_at';
        if (in_array('created_at', $cols))
            return 'created_at';
        return 'updated_at'; // default fallback aman untuk whereDate walau kolom tidak ada tidak akan dipakai
    }
}
