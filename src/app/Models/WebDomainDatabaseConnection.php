<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class WebDomainDatabaseConnection extends Model
{
    use SoftDeletes;

    /**
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
    ];

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'web_domain_id',
        'label',
        'driver',
        'host',
        'port',
        'database_name',
        'username',
        'password',
        'charset',
        'is_default',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'encrypted',
            'port' => 'integer',
            'is_default' => 'boolean',
        ];
    }

    public function webDomain(): BelongsTo
    {
        return $this->belongsTo(WebDomain::class);
    }
}
