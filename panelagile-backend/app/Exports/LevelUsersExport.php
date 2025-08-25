<?php

namespace App\Exports;

use App\Models\LevelUser;
use App\Models\UserManagement;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class LevelUsersExport implements FromArray, WithHeadings
{
    public function headings(): array
    {
        return ['Level Name', 'Description', 'Status', 'Default Homepage', 'Users'];
    }

    public function array(): array
    {
        $rows = [];
        $levels = LevelUser::orderBy('nama_level')->get();

        foreach ($levels as $lvl) {
            // DISTINCT union (role == id) OR (levels_json contains nama_level)
            $count = UserManagement::query()
                ->where(function ($q) use ($lvl) {
                    $q->where('role', $lvl->id)
                        ->orWhereJsonContains('levels_json', $lvl->nama_level);
                })
                ->distinct('id')
                ->count('id');

            $rows[] = [
                $lvl->nama_level,
                $lvl->deskripsi,
                $lvl->status === 'Aktif' ? 'Active' : 'Inactive',
                $lvl->default_homepage,
                $count,
            ];
        }

        return $rows;
    }
}
