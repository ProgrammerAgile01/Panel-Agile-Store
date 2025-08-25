@php
  // Diterima dari export class:
  // $meta = [
  //   'company_name', 'report_title', 'generated_at',
  //   'exported_by', 'exported_at', 'location_date', 'approved_by'
  // ];
  // $columns = [ ['label'=>'Model','key'=>'model'], ... ];
  // $rows = [ ['model'=>'Supra', 'plate'=>'AD ...', ...], ... ];
  // $summary = [ ['label'=>'Total Vehicle','value'=>123], ... ];
@endphp
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    /* Styling HTML hanya jadi baseline di viewer, untuk final look kita kuatkan via AfterSheet */
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; }
    table { border-collapse: collapse; width: 100%; }
    .title { font-weight: bold; font-size: 18px; text-align: center; }
    .subtitle { font-weight: bold; font-size: 13px; text-align: center; }
    .muted { color: #666; font-style: italic; font-size: 10px; text-align: center; }
    .th, .td { border: 1px solid #888; padding: 6px; }
    .th { background: #ededed; font-weight: bold; text-align: center; }
    .no-border { border: none !important; }
    .mt-2 { margin-top: 12px; }
    .mt-4 { margin-top: 24px; }
    .w-50 { width: 50%; }
  </style>
</head>
<body>
  {{-- Baris 1: Logo akan ditempel via Drawing (koordinat A1) --}}
  {{-- Baris 1..2: Judul / Sub-judul (kita merge di AfterSheet) --}}
  <table>
    <tr>
      <td class="no-border" colspan="8" style="height:52px"></td>
    </tr>
    <tr>
      <td class="no-border" colspan="8" class="title">{{ $meta['company_name'] ?? 'COMPANY' }}</td>
    </tr>
    <tr>
      <td class="no-border" colspan="8" class="subtitle">{{ $meta['report_title'] ?? 'Report Export' }}</td>
    </tr>
    <tr>
      <td class="no-border" colspan="8" class="muted">
        @if(!empty($meta['generated_at'])) Generated at: {{ $meta['generated_at'] }} @endif
      </td>
    </tr>
  </table>

  {{-- Header + Data --}}
  <table class="mt-2">
    <thead>
      <tr>
        @foreach($columns as $col)
          <th class="th">{{ $col['label'] }}</th>
        @endforeach
      </tr>
    </thead>
    <tbody>
      @forelse($rows as $row)
        <tr>
          @foreach($columns as $col)
            <td class="td">{{ isset($row[$col['key']]) ? $row[$col['key']] : '' }}</td>
          @endforeach
        </tr>
      @empty
        <tr>
          <td class="td" colspan="{{ count($columns) }}">No data</td>
        </tr>
      @endforelse
    </tbody>
  </table>

  {{-- Meta kiri-kanan & Ringkasan --}}
  <table class="mt-4">
    <tr>
      {{-- Kiri --}}
      <td class="no-border w-50" style="vertical-align:top;">
        <table style="width:100%;">
          <tr>
            <td class="no-border" style="width:40%;">Di Export oleh</td>
            <td class="no-border">{{ $meta['exported_by'] ?? 'Unknown User' }}</td>
          </tr>
          <tr>
            <td class="no-border">Di Export pada</td>
            <td class="no-border">{{ $meta['exported_at'] ?? '' }}</td>
          </tr>

          <tr><td class="no-border" colspan="2" class="mt-4"><strong>Ringkasan:</strong></td></tr>
          @foreach($summary ?? [] as $s)
            <tr>
              <td class="no-border" style="width:40%;">{{ $s['label'] ?? '' }}</td>
              <td class="no-border">{{ $s['value'] ?? '' }}</td>
            </tr>
          @endforeach
        </table>
      </td>

      {{-- Kanan --}}
      <td class="no-border w-50" style="vertical-align:top;">
        <table style="width:100%;">
          <tr>
            <td class="no-border" colspan="3" style="height:18px;">
              {{ $meta['location_date'] ?? '' }}
            </td>
          </tr>
          <tr>
            <td class="no-border" colspan="3">Disetujui oleh,</td>
          </tr>
          <tr><td class="no-border" colspan="3" style="height:50px;"></td></tr>
          <tr>
            <td class="no-border" colspan="3"><strong>{{ $meta['approved_by'] ?? '' }}</strong></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
