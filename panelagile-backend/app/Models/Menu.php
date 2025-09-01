<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Menu extends Model
{
    use SoftDeletes;

    // tetap menunjuk ke tabel mirror yang sama
    protected $table = 'mst_menus';

    protected $fillable = [
        'id',
        'parent_id',
        'level',
        'type',
        'title',
        'icon',
        'color',
        'order_number',
        'crud_builder_id',
        'product_code',
        'route_path',
        'is_active',
        'note',
        'created_by',
    ];

    public $incrementing = true;
    protected $keyType = 'int';

    // (opsional) casting ringan
    protected $casts = [
        'id'           => 'integer',
        'parent_id'    => 'integer',
        'level'        => 'integer',
        'order_number' => 'integer',
        'is_active'    => 'boolean',
    ];

    /** Scope: filter per product_code */
    public function scopeForProduct($q, ?string $code)
    {
        if ($code) $q->where('product_code', $code);
        return $q;
    }

    /** Self relations */
    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function recursiveChildren()
    {
        return $this->children()
            ->with('recursiveChildren')
            ->orderBy('order_number');
    }
}
