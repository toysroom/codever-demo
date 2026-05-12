<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class WebDomain extends Model
{
    use BelongsToAccount, LogsActivity, SoftDeletes;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'member_id',
        'customer_id',
        'company_id',
        'hostname',
        'notes',
        'last_scan',
        'stack',
        'wp_connector_token',
        'wp_version_audit',
    ];

    protected function casts(): array
    {
        return [
            'last_scan' => 'array',
            'wp_connector_token' => 'encrypted',
            'wp_version_audit' => 'array',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * @return HasMany<WebDomainFtpAccount, WebDomain>
     */
    public function ftpAccounts(): HasMany
    {
        return $this->hasMany(WebDomainFtpAccount::class)->orderByDesc('is_default')->orderBy('id');
    }

    /**
     * @return HasMany<WebDomainEmail, WebDomain>
     */
    public function emails(): HasMany
    {
        return $this->hasMany(WebDomainEmail::class)->orderBy('id');
    }

    /**
     * @return HasMany<WebDomainDatabaseConnection, WebDomain>
     */
    public function databaseConnections(): HasMany
    {
        return $this->hasMany(WebDomainDatabaseConnection::class)->orderByDesc('is_default')->orderBy('id');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'member_id',
                'customer_id',
                'company_id',
                'hostname',
                'notes',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
