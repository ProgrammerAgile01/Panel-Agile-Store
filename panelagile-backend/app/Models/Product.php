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
     public function packages()
    {
        return $this->hasMany(ProductPackage::class, 'product_code', 'product_code');
        // bisa juga pakai product_id kalau konsisten pakai UUID
    }

    // 1 Product → banyak Pricelist
    public function pricelists()
    {
        return $this->hasMany(ProductPricelist::class, 'product_code', 'product_code');
    }
}
