<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomerCrmNote extends Model
{
    use SoftDeletes;

    protected $table = 'customer_crm_notes';

    protected $fillable = [
        'customer_id',
        'user_id',
        'body',
        'reminder_at',
        'reminder_notified_at',
    ];

    protected function casts(): array
    {
        return [
            'reminder_at' => 'datetime',
            'reminder_notified_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
