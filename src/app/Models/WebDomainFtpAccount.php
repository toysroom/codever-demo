<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class WebDomainFtpAccount extends Model
{
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
        'protocol',
        'host',
        'port',
        'username',
        'password',
        'remote_base_path',
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

    /**
     * @return HasMany<WebDomainFtpConnectionTestLog, WebDomainFtpAccount>
     */
    public function ftpConnectionTestLogs(): HasMany
    {
        return $this->hasMany(WebDomainFtpConnectionTestLog::class, 'web_domain_ftp_account_id');
    }

    /**
     * Ultimo tentativo registrato da {@see ftpConnectionTestLogs()}.
     *
     * @return HasOne<WebDomainFtpConnectionTestLog, WebDomainFtpAccount>
     */
    public function latestFtpConnectionTestLog(): HasOne
    {
        return $this->hasOne(WebDomainFtpConnectionTestLog::class, 'web_domain_ftp_account_id')->latestOfMany('created_at');
    }
}
