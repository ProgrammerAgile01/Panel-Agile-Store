<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductFeature extends Model
{
    protected $table = 'mst_product_features';

    public $incrementing = false;     // PK string
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'product_code',
        'item_type',          // FEATURE | SUBFEATURE
        'feature_code',
        'name',               // <- pakai 'name' (sama dgn warehouse)
        'description',
        'module_name',
        'menu_parent_code',   // feature_code parent (untuk tree)
        'is_active',
        'order_number',
        'price_addon',
        'trial_available',
        'trial_days',
        'synced_at',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'is_active'       => 'boolean',
        'trial_available' => 'boolean',
        'trial_days'      => 'integer',
        'price_addon'     => 'decimal:2',
        'synced_at'       => 'datetime',
    ];
}
