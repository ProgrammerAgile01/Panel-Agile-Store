<?php

namespace App\Http\Controllers;

use App\Models\LevelUser;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\LevelUsersExport;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

class LevelUserController extends Controller
{
    /** GET /api/level_users */
  public function index()
{
    try {
        $cols = ['id', 'nama_level'];
        foreach (['deskripsi','status','default_homepage'] as $c) {
            if (\Illuminate\Support\Facades\Schema::hasColumn('sys_level_user', $c)) $cols[] = $c;
        }
        $orderCol = \Illuminate\Support\Facades\Schema::hasColumn('sys_level_user','updated_at') ? 'updated_at' : 'id';

        $levels = \App\Models\LevelUser::query()
            ->select($cols)
            ->orderByDesc($orderCol)
            ->get();

        // ⬇️ sertakan user_count (pakai accessor di model)
        $rows = $levels->map(fn(\App\Models\LevelUser $m) => [
            'id'               => (int) $m->id,
            'nama_level'       => $m->nama_level ?? '',
            'deskripsi'        => $m->deskripsi ?? '',
            'status'           => $m->status ?? 'Aktif',
            'default_homepage' => $m->default_homepage ?? 'dashboard',
            'user_count'       => $m->user_count,   // <— penting
        ])->values();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil menampilkan data LevelUser',
            'data'    => $rows,
        ], 200);

    } catch (\Throwable $e) {
        \Illuminate\Support\Facades\Log::error('LevelUser index error', ['msg' => $e->getMessage()]);
        return response()->json([
            'success' => false,
            'message' => 'Gagal menampilkan data LevelUser: ' . $e->getMessage(),
        ], 500);
    }
}


    /** GET /api/level_users/{id} */
    public function show($id)
    {
        try {
            $level = LevelUser::findOrFail($id);
            $data = [
                'id'               => (int) $level->id,
                'nama_level'       => $level->nama_level ?? '',
                'deskripsi'        => $level->deskripsi ?? '',
                'status'           => $level->status ?? 'Aktif',
                'default_homepage' => $level->default_homepage ?? 'dashboard',
                'user_count'       => $level->user_count, // dihitung on-demand
            ];

            return response()->json([
                'success' => true,
                'message' => 'OK',
                'data'    => $data,
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => "Gagal menampilkan data LevelUser id=$id: " . $e->getMessage(),
            ], 500);
        }
    }

    /** POST /api/level_users */
    public function store(Request $request)
    {
        // Tidak ada hard-guard di sini → biarkan matrix permission (add) yang menentukan
        $validated = $request->validate([
            'nama_level'       => 'required|string|max:255',
            'deskripsi'        => 'nullable|string',
            'status'           => 'required|in:Aktif,Tidak Aktif',
            'default_homepage' => 'nullable|string|max:100',
        ]);

        $row = LevelUser::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'LevelUser berhasil dibuat',
            'data'    => $row
        ], 201);
    }

    /** PUT /api/level_users/{id} */
    public function update(Request $request, $id)
    {
        // Admin akan tertahan di middleware permission:edit,level-user
        $row = LevelUser::findOrFail($id);

        $validated = $request->validate([
            'nama_level'       => 'required|string|max:255',
            'deskripsi'        => 'nullable|string',
            'status'           => 'required|in:Aktif,Tidak Aktif',
            'default_homepage' => 'nullable|string|max:100',
        ]);

        $row->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'LevelUser berhasil diupdate',
            'data'    => $row
        ], 200);
    }

    /** DELETE /api/level_users/{id} */
    public function destroy($id)
    {
        // Akses delete ditentukan oleh permission:delete,level-user
        $row = LevelUser::findOrFail($id);
        $row->delete();

        return response()->json([
            'success' => true,
            'message' => '🗑️ LevelUser dihapus'
        ], 200);
    }

    /** GET /api/level_users/export */
    public function exportExcel()
    {
        return Excel::download(new LevelUsersExport, 'level_users.xlsx');
    }
}
