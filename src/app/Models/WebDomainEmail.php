<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebDomainEmail extends Model
{
    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'web_domain_id',
        'label',
        'email',
        'purpose',
        'notes',
    ];

    public function webDomain(): BelongsTo
    {
        return $this->belongsTo(WebDomain::class);
    }
}
