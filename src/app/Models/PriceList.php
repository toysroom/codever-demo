<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class PriceList extends Model
{
    use BelongsToAccount, HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'member_id',
        'name',
        'code',
        'currency',
        'valid_from',
        'valid_to',
        'is_default',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'valid_from' => 'date',
            'valid_to' => 'date',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'code', 'currency', 'valid_from', 'valid_to', 'is_default', 'is_active', 'notes'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function productPrices(): HasMany
    {
        return $this->hasMany(ProductPrice::class, 'price_list_id');
    }
}
