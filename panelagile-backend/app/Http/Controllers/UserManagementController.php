<?php

namespace App\Http\Controllers;

use App\Models\UserManagement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    /** GET /api/user_managements */
    public function index(): JsonResponse
    {
        $rows = UserManagement::query()
            ->select('id', 'nama', 'email', 'role', 'status', 'levels_json', 'notes', 'last_login_at')
            ->latest('id')
            ->get();

        // Response bentuk yang sudah dipakai UI (levels & last_login via accessor)
        return response()->json($rows);
    }

    /** POST /api/user_managements
     * Body (sesuai UI):
     * { nama, email, status, levels: [nama_level,...], role_name, notes }
     * (password optional; UI kamu tidak kirim → kita tidak wajibkan)
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nama' => 'required|string|max:150',
            'email' => 'required|email|unique:sys_users,email',
            'status' => 'required|string|in:Active,Invited,Suspended',
            'levels' => 'required|array|min:1',
            'levels.*' => 'string',
            'role_name' => 'nullable|string',  // nama level utk FK role
            'notes' => 'nullable|string',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        // cari FK role berdasarkan role_name (nama level); fallback ke level pertama
        $roleName = $data['role_name'] ?? ($data['levels'][0] ?? null);
        $roleId = null;
        if ($roleName) {
            $roleId = DB::table('sys_level_user')->where('nama_level', $roleName)->value('id');
        }

        $payload = [
            'nama' => $data['nama'],
            'email' => $data['email'],
            'role' => $roleId,
            'status' => $data['status'],
            'levels_json' => $data['levels'],
            'notes' => $data['notes'] ?? null,
            'last_login_at' => null,
        ];

        if (!empty($data['password'])) {
            $payload['password'] = Hash::make($data['password']);
        }

        $user = UserManagement::create($payload);

        return response()->json(['success' => true, 'data' => $user], 201);
    }

    /** PUT /api/user_managements/{id}
     * Body sama dengan store; password optional (kalau ada → ganti)
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = UserManagement::findOrFail($id);

        $data = $request->validate([
            'nama' => 'sometimes|required|string|max:150',
            'email' => ['sometimes', 'required', 'email', Rule::unique('sys_users', 'email')->ignore($user->id)],
            'status' => 'sometimes|required|string|in:Active,Invited,Suspended',
            'levels' => 'sometimes|required|array|min:1',
            'levels.*' => 'string',
            'role_name' => 'nullable|string',
            'notes' => 'nullable|string',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        if (array_key_exists('levels', $data)) {
            $user->levels_json = $data['levels'];
        }

        if (!empty($data['role_name']) || (isset($data['levels']) && count($data['levels']) > 0)) {
            $roleName = $data['role_name'] ?? ($data['levels'][0] ?? null);
            if ($roleName) {
                $roleId = DB::table('sys_level_user')->where('nama_level', $roleName)->value('id');
                $user->role = $roleId;
            }
        }

        foreach (['nama', 'email', 'status', 'notes'] as $f) {
            if (array_key_exists($f, $data))
                $user->{$f} = $data[$f];
        }

        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        return response()->json(['success' => true, 'data' => $user]);
    }

    /** DELETE /api/user_managements/{id} */
    public function destroy($id): JsonResponse
    {
        $user = UserManagement::findOrFail($id);
        $user->delete();

        return response()->json(['success' => true]);
    }
}
