<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $table = 'mst_products';

    protected $fillable = [
        'product_code',
        'product_name',
        'category',
        'status',
        'description',
        'db_name',              // <— NEW
        'total_features',
        'upstream_updated_at',
    ];

    protected $casts = [
        'upstream_updated_at' => 'datetime',
    ];
}
