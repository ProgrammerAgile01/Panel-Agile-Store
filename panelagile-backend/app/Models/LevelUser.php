<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LevelUser extends Model
{
    protected $table = 'sys_level_user';
    public $timestamps = false; // matikan bila tabel tak punya created_at/updated_at

    protected $fillable = [
        'nama_level',
        'deskripsi',
        'status',
        'default_homepage',
    ];

    protected $casts = [
        'status' => 'string',
        'default_homepage' => 'string',
    ];

    // Jangan auto-append agar list ringan & anti error
    // protected $appends = ['user_count'];

    public function usersByRole(): HasMany
    {
        return $this->hasMany(UserManagement::class, 'role');
    }

    /**
     * Hitung total user unik terkait level ini:
     *  - role FK = level_id
     *  - ATAU levels_json mengandung nama_level
     * Dipanggil manual (tidak auto-append).
     */
    public function getUserCountAttribute(): int
    {
        $q = UserManagement::query()->where('role', $this->id);

        try {
            // untuk kolom JSON & DB yang mendukung JSON_CONTAINS
            $q->orWhereJsonContains('levels_json', $this->nama_level);
        } catch (\Throwable $e) {
            // fallback aman untuk kolom TEXT/MariaDB lama
            $needle = '"' . str_replace('"', '\"', $this->nama_level) . '"';
            $q->orWhere('levels_json', 'like', '%' . $needle . '%');
        }

        return $q->distinct('id')->count('id');
    }
}
