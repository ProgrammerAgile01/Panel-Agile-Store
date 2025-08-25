<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Hash;

class UserManagement extends Authenticatable implements JWTSubject
{
    use Notifiable;

    protected $table = 'sys_users';
    protected $primaryKey = 'id';

    protected $fillable = [
        'nama',
        'email',
        'password',
        'role',
        'status',
        'levels_json',
        'notes',
        'last_login_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'levels_json' => 'array',
        'last_login_at' => 'datetime',
    ];

    // Relasi
    public function levelUser()
    {
        return $this->belongsTo(\App\Models\LevelUser::class, 'role');
    }

    protected $appends = ['levels', 'last_login'];

    public function getLevelsAttribute(): array
    {
        return $this->levels_json ?? [];
    }

    public function getLastLoginAttribute(): string
    {
        return $this->last_login_at ? $this->last_login_at->diffForHumans() : 'Never';
    }

    /**
     * Mutator password: auto-hash hanya jika value belum hash
     */
    protected function password(): Attribute
    {
        return Attribute::make(
            set: function ($value) {
                if (empty($value)) {
                    return $this->password;
                }
                $info = password_get_info($value);
                $alreadyHashed = ($info['algoName'] ?? 'unknown') !== 'unknown';

                return $alreadyHashed ? $value : Hash::make($value);
            }
        );
    }

    /* ===== JWTSubject ===== */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [];
    }
}
