<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class ProductPricelist extends Model
{
    use SoftDeletes;

    protected $table = 'product_pricelists';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'product_id',
        'product_code',
        'currency',
        'tax_mode',
    ];

    protected static function booted()
    {
        static::creating(function ($m) {
            if (!$m->id) $m->id = (string) Str::uuid();
        });
    }

    public function items()
    {
        return $this->hasMany(ProductPricelistItem::class, 'pricelist_id', 'id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
