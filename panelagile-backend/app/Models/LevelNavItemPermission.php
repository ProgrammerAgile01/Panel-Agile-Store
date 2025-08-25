<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LevelNavItemPermission extends Model
{
    // PENTING: tabel yang dipakai
    protected $table = 'sys_permissions';

    protected $fillable = [
        'level_user_id',
        'nav_item_id',
        'access',
        'view',
        'add',
        'edit',
        'delete',
        'approve',
        'print'
    ];

    protected $casts = [
        'level_user_id' => 'integer',
        'nav_item_id' => 'integer',
        'access' => 'boolean',
        'view' => 'boolean',
        'add' => 'boolean',
        'edit' => 'boolean',
        'delete' => 'boolean',
        'approve' => 'boolean',
        'print' => 'boolean',
    ];

    public function level()
    {
        return $this->belongsTo(LevelUser::class, 'level_user_id');
    }

    public function navItem()
    {
        return $this->belongsTo(NavItem::class, 'nav_item_id');
    }
}
