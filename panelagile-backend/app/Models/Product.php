<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

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
        'db_name',
        'image',
        'total_features',
        'upstream_updated_at',
    ];

    protected $appends = ['image_url'];

    protected $casts = [
        'upstream_updated_at' => 'datetime',
    ];

    /**
     * Kembalikan full/public URL untuk image bila ada.
     * Storage::url() biasanya menghasilkan '/storage/...'
     * Jika ingin absolute URL gunakan url(Storage::url(...))
     */
    public function getImageUrlAttribute()
    {
        if (!$this->image) {
            return null;
        }

        // Jika ingin absolute url (recommended) -> uncomment line bawah:
        // return url(Storage::url($this->image));

        return Storage::url($this->image);
    }

     public function packages()
    {
        return $this->hasMany(ProductPackage::class, 'product_code', 'product_code');
        // bisa juga pakai product_id kalau konsisten pakai UUID
    }
  /* ---- Relations ---- */
    public function menus()
    {
        return $this->hasMany(Menu::class, 'product_code', 'product_code')
            ->whereNull('deleted_at')
            ->orderBy('order_number');
    }

    public function features()
    {
        return $this->hasMany(ProductFeature::class, 'product_code', 'product_code');
    }

   
   
    /* ---- Scopes ---- */
    public function scopeActive($q)
    {
        return $q->where('status', 'active');
    }
    // 1 Product → banyak Pricelist
    public function pricelists()
    {
        return $this->hasMany(ProductPricelist::class, 'product_code', 'product_code');
    }
}
