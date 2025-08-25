<?php

namespace App\Exports;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Concerns\WithEvents;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use Maatwebsite\Excel\Events\AfterSheet;

class GenericReportExport implements FromView, ShouldAutoSize, WithDrawings, WithEvents
{
    protected array $meta;
    protected array $columns;
    protected array $rows;
    protected array $summary;
    protected ?string $logoPath;

    /**
     * @param array $config [
     *   'meta' => [
     *       'company_name', 'report_title', 'generated_at',
     *       'exported_by', 'exported_at', 'location_date', 'approved_by'
     *   ],
     *   'columns' => [['label' => 'Col', 'key' => 'col', 'format' => null], ...],
     *   'rows' => [ [col1, col2, ...], ... ],
     *   'summary' => [ ['label' => 'Total', 'value' => 10], ... ],
     *   'logo_path' => 'public/assets/logo/agile-store.png'
     * ]
     */
    public function __construct(array $config)
    {
        $this->meta = $config['meta'] ?? [];
        $this->columns = $config['columns'] ?? [];
        $this->rows = $config['rows'] ?? [];
        $this->summary = $config['summary'] ?? [];
        $this->logoPath = $config['logo_path'] ?? null;
    }

    public function view(): View
    {
        return view('exports.report', [
            'meta' => $this->meta,
            'columns' => $this->columns,
            'rows' => $this->rows,
            'summary' => $this->summary,
        ]);
    }

    public function drawings()
    {
        if (!$this->logoPath)
            return [];

        $fullPath = public_path($this->logoPath);
        if (!file_exists($fullPath))
            return [];

        $drawing = new Drawing();
        $drawing->setName('Logo');
        $drawing->setDescription('Company Logo');
        $drawing->setPath($fullPath);
        $drawing->setHeight(60);       // tinggi logo
        $drawing->setCoordinates('A1'); // posisi di sheet

        return [$drawing];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Bold judul & lebih besar
                $sheet->getStyle('A1:Z2')->getFont()->setBold(true);
                $sheet->getStyle('A2:Z2')->getFont()->setSize(13);

                // Header tabel bold
                // Cari baris header berdasarkan view: header ada di baris 6 (kira‑kira)
                // Namun karena auto-size dan view, kita mark seluruh baris yang punya teks 'Ringkasan' dsb tidak perlu.
                // Aman: bold baris 6 (header table)
                $sheet->getStyle('A6:Z6')->getFont()->setBold(true);

                // Tinggi baris judul
                $sheet->getRowDimension(1)->setRowHeight(46);

                // Wrap text untuk semua kolom (biar rapi)
                $highestRow = $sheet->getHighestRow();
                $highestCol = $sheet->getHighestColumn();
                $sheet->getStyle("A1:{$highestCol}{$highestRow}")
                    ->getAlignment()->setWrapText(true);

                // Border tabel data – HTML sudah ada border, ini sekadar jaga-jaga
                // (opsional) – bisa di-skip
            },
        ];
    }
}
