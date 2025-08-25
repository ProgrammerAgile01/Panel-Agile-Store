<?php

namespace App\Http\Controllers;

use App\Models\LevelUser;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\LevelUsersExport;

class LevelUserController extends Controller
{
    public function index()
    {
        try {
            // get() sudah menyertakan accessor 'user_count'
            $levelusers = LevelUser::orderByDesc('updated_at')->get();

            return response()->json([
                'success' => true,
                'message' => "Berhasil menampilkan data LevelUser",
                'data' => $levelusers,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => "Gagal menampilkan data LevelUser " . $e->getMessage(),
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $leveluser = LevelUser::findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => "Berhasil menampilkan data LevelUser dari id: $id",
                'data' => $leveluser,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => "Gagal menampilkan data LevelUser dari id: $id " . $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_level' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'status' => 'required|in:Aktif,Tidak Aktif',
            'default_homepage' => 'nullable|string|max:100',
        ]);

        $leveluser = LevelUser::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'LevelUser berhasil dibuat',
            'data' => $leveluser
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $leveluser = LevelUser::findOrFail($id);

        $validated = $request->validate([
            'nama_level' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'status' => 'required|in:Aktif,Tidak Aktif',
            'default_homepage' => 'nullable|string|max:100',
        ]);

        $leveluser->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'LevelUser berhasil diupdate',
            'data' => $leveluser
        ], 200);
    }

    public function destroy($id)
    {
        $leveluser = LevelUser::findOrFail($id);
        $leveluser->delete();

        return response()->json([
            'success' => true,
            'message' => '🗑️ LevelUser dihapus'
        ], 200);
    }

    /**
     * Export Excel (.xlsx) — gunakan export yang juga menghitung DISTINCT
     */
    public function exportExcel()
    {
        return Excel::download(new LevelUsersExport, 'level_users.xlsx');
    }
}
