<?php
// app/Models/NavItem.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NavItem extends Model
{
    // <- tambahkan ini:
    protected $table = 'mst_nav_items';

    protected $fillable = [
        'label',
        'slug',
        'icon',
        'parent_id',
        'order_number',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Kalau PK bukan 'id', set juga:
    // protected $primaryKey = '...';

    // Kalau tabel tidak punya created_at/updated_at:
    // public $timestamps = false;

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('order_number');
    }

    public function scopeActive($q)
    {
        return $q->where('is_active', true);
    }
}
