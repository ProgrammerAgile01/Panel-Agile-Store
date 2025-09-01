<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ProductPricelistItem extends Model
{
    protected $table = 'product_pricelist_items';

    public $incrementing = false;       // <-- karena id UUID string
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'pricelist_id',
        'package_id',
        'package_code',
        'duration_id',
        'duration_code',
        'price',
        'discount',
        'min_billing_cycle',
        'prorate',
        'effective_start',
        'effective_end',
    ];

    protected $casts = [
        'price'              => 'decimal:2',
        'discount'           => 'decimal:2',
        'min_billing_cycle'  => 'integer',
        'prorate'            => 'boolean',
        'effective_start'    => 'datetime',   // penting → Carbon, bukan 'date'
        'effective_end'      => 'datetime',
    ];




    protected static function booted()
    {
        static::creating(function ($m) {
            if (!$m->id) $m->id = (string) Str::uuid();
        });
    }

    public function header()
    {
        return $this->belongsTo(ProductPricelist::class, 'pricelist_id', 'id');
    }

    public function package()
    {
        return $this->belongsTo(ProductPackage::class, 'package_id');
    }

    public function duration()
    {
        return $this->belongsTo(Duration::class, 'duration_id');
    }
}
