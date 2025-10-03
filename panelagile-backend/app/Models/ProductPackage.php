<?php

// namespace App\Models;

// use Illuminate\Database\Eloquent\Model;
// use Illuminate\Database\Eloquent\SoftDeletes;

// class ProductPackage extends Model
// {
//     use SoftDeletes;

//     protected $table = 'mst_product_packages';

//     protected $fillable = [
//         'product_id',
//         'product_code',
//         'package_code',
//         'name',
//         'description',
//         'status',
//         'notes',
//         'order_number',
//     ];

//     protected $casts = [
//         'order_number' => 'integer',
//     ];
//     public function product()
//     {
//         return $this->belongsTo(Product::class, 'product_code', 'product_code');
//     }
// }



namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductPackage extends Model
{
    use SoftDeletes;

    protected $table = 'mst_product_packages';

    protected $fillable = [
        'product_id',
        'product_code',
        'package_code',
        'name',
        'description',
        'status',
        'notes',
        'order_number',
    ];

    protected $casts = [
        'order_number' => 'integer',
    ];

    // Relasi ke product via product_code
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_code', 'product_code');
    }
}
