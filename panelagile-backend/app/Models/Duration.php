<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Duration extends Model
{
    use SoftDeletes;

    protected $table = 'mst_durations';   // pakai mst_durations

    protected $fillable = [
        'name',
        'length',
        'unit',
        'code',
        'is_default',
        'status',
        'notes',
        'addon_discount_percent',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'addon_discount_percent' => 'integer',
    ];
}
