<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class WebHostingProvider extends Model
{
    use LogsActivity;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'slug',
        'name',
        'website_url',
    ];

    /**
     * @return HasMany<WebServer, WebHostingProvider>
     */
    public function servers(): HasMany
    {
        return $this->hasMany(WebServer::class, 'web_hosting_provider_id');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'slug',
                'name',
                'website_url',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
