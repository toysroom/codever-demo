<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Module extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'slug',
        'name',
        'description',
        'price',
        'metadata',
        'is_core',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'metadata' => 'array',
            'is_core' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(Member::class, 'member_module')
            ->withPivot(['status', 'starts_at', 'ends_at', 'stripe_price_id', 'stripe_subscription_item_id'])
            ->withTimestamps();
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
