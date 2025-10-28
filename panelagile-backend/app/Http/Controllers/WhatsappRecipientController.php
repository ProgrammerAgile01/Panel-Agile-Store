<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\WhatsappRecipient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WhatsappRecipientController extends Controller
{
    // public function __construct()
    // {
    //     // Sesuaikan middleware auth dengan projectmu jika bukan 'jwt.auth'
    //     $this->middleware('jwt.auth');
    // }

    /**
     * Normalize phone number to international format.
     *
     * Examples:
     *  - "085712345678" -> "+6285712345678"
     *  - "85712345678"  -> "+6285712345678"
     *  - "6285712345678"-> "+6285712345678"
     *  - "+6285712345678" -> "+6285712345678"
     *
     * If you prefer to store raw input (e.g. "0857..."), skip calling this and save raw.
     */
    protected function normalizePhone(string $raw): string
    {
        $s = trim($raw);
        // remove all characters except digits and leading plus
        // keep a leading + if present
        $s = preg_replace('/[^\d\+]/', '', $s);

        // already + followed by digits
        if (preg_match('/^\+\d+$/', $s)) {
            return $s;
        }

        // starts with 0 -> replace leading 0 with +62
        if (preg_match('/^0\d+$/', $s)) {
            return '+62' . substr($s, 1);
        }

        // starts with 62 (no +) -> add +
        if (preg_match('/^62\d+$/', $s)) {
            return '+' . $s;
        }

        // starts with digits and begins with 8 or 9 (local mobile without leading 0) -> assume +62
        if (preg_match('/^[89]\d+$/', $s)) {
            return '+62' . $s;
        }

        // fallback: return digits only (or as-is)
        return $s;
    }

    /**
     * Basic phone format validator used after normalization.
     * Accepts optional leading + and 6..20 digits total.
     */
    protected function isValidPhone(string $phone): bool
    {
        return (bool) preg_match('/^\+?[0-9]{6,20}$/', $phone);
    }

    /**
     * GET /api/whatsapp-recipients
     */
    public function index(Request $request)
    {
        $items = WhatsappRecipient::orderBy('created_at', 'desc')->get();
        return response()->json(['data' => $items]);
    }

    /**
     * POST /api/whatsapp-recipients
     */
    public function store(Request $request)
    {
        $request->validate([
            'phone_number' => ['nullable','string','max:50'],
            'phoneNumber'  => ['nullable','string','max:50'],
            'name'         => ['nullable','string','max:150'],
            'fullName'     => ['nullable','string','max:150'],
            'position'     => ['nullable','string','max:150'],
            'positionName' => ['nullable','string','max:150'],
        ]);

        $phoneRaw = (string) $request->input('phone_number', $request->input('phoneNumber', ''));
        $name     = (string) $request->input('name', $request->input('fullName', ''));
        $position = (string) $request->input('position', $request->input('positionName', ''));

        if (trim($phoneRaw) === '' || trim($name) === '' || trim($position) === '') {
            return response()->json(['message' => 'phone_number, name and position are required'], 422);
        }

        // Normalisasi ke +62 (rekomendasi agar konsisten dengan provider WA)
        $phoneToSave = $this->normalizePhone($phoneRaw);

        // Jika ingin menyimpan apa adanya (misalnya "0857..."), ganti => $phoneToSave = trim($phoneRaw);

        if (! $this->isValidPhone($phoneToSave)) {
            return response()->json(['message' => 'phone_number format invalid after normalization'], 422);
        }

        $payload = [
            'phone_number' => $phoneToSave,
            'name'         => trim($name),
            'position'     => trim($position),
        ];

        // set created_by only if the auth user exists in users table (prevent FK errors)
        $userId = Auth::id();
        if ($userId && User::where('id', $userId)->exists()) {
            $payload['created_by'] = $userId;
        } else {
            $payload['created_by'] = null;
        }

        $item = WhatsappRecipient::create($payload);

        return response()->json(['data' => $item], 201);
    }

    /**
     * GET /api/whatsapp-recipients/{id}
     */
    public function show($id)
    {
        $item = WhatsappRecipient::findOrFail($id);
        return response()->json(['data' => $item]);
    }

    /**
     * PUT /api/whatsapp-recipients/{id}
     * Accept POST with _method=PUT as well (route config)
     */
    public function update(Request $request, $id)
    {
        $item = WhatsappRecipient::findOrFail($id);

        $request->validate([
            'phone_number' => ['nullable','string','max:50'],
            'phoneNumber'  => ['nullable','string','max:50'],
            'name'         => ['nullable','string','max:150'],
            'fullName'     => ['nullable','string','max:150'],
            'position'     => ['nullable','string','max:150'],
            'positionName' => ['nullable','string','max:150'],
        ]);

        $phoneRaw = (string) $request->input('phone_number', $request->input('phoneNumber', $item->phone_number));
        $name     = (string) $request->input('name', $request->input('fullName', $item->name));
        $position = (string) $request->input('position', $request->input('positionName', $item->position));

        if (trim($phoneRaw) === '' || trim($name) === '' || trim($position) === '') {
            return response()->json(['message' => 'phone_number, name and position are required'], 422);
        }

        // Normalisasi (sama dengan store). Jika mau simpan apa adanya, ubah behaviour di sini.
        $phoneToSave = $this->normalizePhone($phoneRaw);

        if (! $this->isValidPhone($phoneToSave)) {
            return response()->json(['message' => 'phone_number format invalid after normalization'], 422);
        }

        $payload = [
            'phone_number' => $phoneToSave,
            'name'         => trim($name),
            'position'     => trim($position),
        ];

        $userId = Auth::id();
        if ($userId && User::where('id', $userId)->exists()) {
            $payload['updated_by'] = $userId;
        } else {
            $payload['updated_by'] = null;
        }

        $item->update($payload);

        return response()->json(['data' => $item]);
    }

    /**
     * DELETE /api/whatsapp-recipients/{id}
     */
    public function destroy($id)
    {
        $item = WhatsappRecipient::findOrFail($id);
        $item->delete();
        return response()->json(['success' => true]);
    }

    /**
     * GET /api/whatsapp-recipients/stats
     */
    public function stats()
    {
        $count = WhatsappRecipient::count();
        return response()->json(['data' => ['total' => $count]]);
    }
}
