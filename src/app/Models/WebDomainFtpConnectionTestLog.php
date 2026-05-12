<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebDomainFtpConnectionTestLog extends Model
{
    public const KIND_ROUNDTRIP_TXT = 'roundtrip_txt';

    public const KIND_CONNECTOR_UPLOAD = 'connector_upload';

    public const KIND_CONNECTOR_DEPLOY = 'connector_deploy';

    public const UPDATED_AT = null;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'web_domain_id',
        'web_domain_ftp_account_id',
        'kind',
        'success',
        'message',
        'triggered_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'success' => 'boolean',
        ];
    }

    public function webDomain(): BelongsTo
    {
        return $this->belongsTo(WebDomain::class);
    }

    public function ftpAccount(): BelongsTo
    {
        return $this->belongsTo(WebDomainFtpAccount::class, 'web_domain_ftp_account_id');
    }

    public function triggeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'triggered_by_user_id');
    }
}
