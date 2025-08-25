<?php

namespace App\Exports;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;

class BladeReportExport implements FromView, ShouldAutoSize, WithDrawings, WithEvents
{
    /** @var array<string,mixed> */
    protected array $meta;
    /** @var array<int,array{label:string,key:string,format?:string}> */
    protected array $columns;
    /** @var array<int,array<string,mixed>> */
    protected array $rows;
    /** @var array<int,array{label:string,value:mixed}> */
    protected array $summary;
    protected ?string $logoPath;

    /**
     * @param array{
     *   meta: array<string,mixed>,
     *   columns: array<int,array{label:string,key:string,format?:string}>,
     *   rows: array<int,array<string,mixed>>,
     *   summary?: array<int,array{label:string,value:mixed}>,
     *   logo_path?: string
     * } $config
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

    /** Tempel logo di A1 dari public/assets/logo/agile-store.png */
    public function drawings()
    {
        if (!$this->logoPath)
            return [];
        $path = public_path($this->logoPath);
        if (!is_file($path))
            return [];

        $d = new Drawing();
        $d->setName('Logo');
        $d->setDescription('Company Logo');
        $d->setPath($path);
        $d->setHeight(60);        // match tinggi header
        $d->setCoordinates('A1'); // pojok kiri atas
        return [$d];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $e) {
                $sheet = $e->sheet->getDelegate();

                // Merge & style judul/subjudul/Generated at
                // Di Blade kita taruh title di B1..H1; generated at di B4..H4
                $sheet->mergeCells('B1:H1');
                $sheet->mergeCells('B2:H2');
                $sheet->mergeCells('B4:H4');
                $sheet->getStyle('B1')->getFont()->setBold(true)->setSize(18);
                $sheet->getStyle('B1')->getAlignment()->setHorizontal('center');
                $sheet->getStyle('B2')->getFont()->setBold(true)->setSize(13);
                $sheet->getStyle('B2')->getAlignment()->setHorizontal('center');
                $sheet->getStyle('B4')->getFont()->setItalic(true)->setSize(10);
                $sheet->getStyle('B4')->getAlignment()->setHorizontal('center');
                $sheet->getRowDimension(1)->setRowHeight(46);

                // Header table di baris 6 (sesuai template)
                $colCount = max(1, count($this->columns));
                $headerRange = 'A6:' . $this->col($colCount) . '6';
                $sheet->getStyle($headerRange)->getFont()->setBold(true);
                $sheet->getStyle($headerRange)->getFill()->setFillType('solid')->getStartColor()->setARGB('FFEDEDED');
                $sheet->getStyle($headerRange)->getBorders()->getAllBorders()->setBorderStyle('thin');
                $sheet->getStyle($headerRange)->getAlignment()->setHorizontal('center')->setVertical('center');

                // Data border
                $startDataRow = 7;
                $endDataRow = $startDataRow + max(0, count($this->rows)) - 1;
                if ($endDataRow >= $startDataRow) {
                    $dataRange = 'A' . $startDataRow . ':' . $this->col($colCount) . $endDataRow;
                    $sheet->getStyle($dataRange)->getBorders()->getAllBorders()->setBorderStyle('thin');

                    // Format kolom (jika ada)
                    foreach ($this->columns as $i => $col) {
                        if (!empty($col['format'])) {
                            $colLetter = $this->col($i + 1);
                            $sheet->getStyle($colLetter . $startDataRow . ':' . $colLetter . $endDataRow)
                                ->getNumberFormat()->setFormatCode($col['format']);
                        }
                    }
                }

                // Wrap semua
                $highestRow = $sheet->getHighestRow();
                $highestCol = $sheet->getHighestColumn();
                $sheet->getStyle("A1:{$highestCol}{$highestRow}")
                    ->getAlignment()->setWrapText(true)->setVertical('center');

                // Lebar kolom pertama sedikit lebih lebar
                $sheet->getColumnDimension('A')->setWidth(22);
            },
        ];
    }

    /** 1 -> A, 2 -> B, ... */
    private function col(int $index): string
    {
        $s = '';
        while ($index > 0) {
            $m = ($index - 1) % 26;
            $s = chr(65 + $m) . $s;
            $index = intdiv($index - $m, 26) - 1;
        }
        return $s;
    }
}
