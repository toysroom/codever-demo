<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class WebServer extends Model
{
    use BelongsToAccount, LogsActivity, SoftDeletes;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'member_id',
        'web_hosting_provider_id',
        'label',
        'host',
        'notes',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function hostingProvider(): BelongsTo
    {
        return $this->belongsTo(WebHostingProvider::class, 'web_hosting_provider_id');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'member_id',
                'web_hosting_provider_id',
                'label',
                'host',
                'notes',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
