<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PackageMatrix extends Model
{
    protected $table = 'mst_package_matrix';

    protected $fillable = [
        'product_code',
        'package_id',
        'item_type',   // feature | menu
        'item_id',     // ProductFeature.id atau mst_menus.id
        'enabled',
    ];

    protected $casts = [
        'package_id' => 'integer',
        'enabled'    => 'boolean',
    ];

    /* Scopes */
    public function scopeForProduct($q, string $code)
    {
        return $q->where('product_code', $code);
    }

    public function scopeForType($q, ?string $type)
    {
        if ($type && in_array($type, ['feature','menu'])) {
            $q->where('item_type', $type);
        }
        return $q;
    }

    public function package()
    {
        return $this->belongsTo(ProductPackage::class, 'package_id');
    }
}
