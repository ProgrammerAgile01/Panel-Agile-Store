<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LevelUser extends Model
{
    protected $table = 'sys_level_user';

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

    protected $appends = ['user_count'];

    /**
     * Relasi user via FK role utama (user_management.role = level_user.id)
     */
    public function usersByRole(): HasMany
    {
        return $this->hasMany(UserManagement::class, 'role');
    }

    /**
     * Accessor: jumlah user unik yang terkait level ini
     * (union antara role=level_id OR levels_json berisi nama_level).
     * Menghindari double-count dengan DISTINCT pada id.
     */
    public function getUserCountAttribute(): int
    {
        return UserManagement::query()
            ->where(function ($q) {
                $q->where('role', $this->id)
                    ->orWhereJsonContains('levels_json', $this->nama_level);
            })
            ->distinct('id')
            ->count('id');
    }
}
