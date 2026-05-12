<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Validation\ValidationException;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Company extends Model
{
    use BelongsToAccount, HasFactory, LogsActivity, SoftDeletes;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'member_id',
        'name',
        'legal_name',
        'vat_number',
        'email',
        'phone',
        'pec',
        'sdi_recipient_code',
        'address',
        'city',
        'postal_code',
        'province',
        'country',
        'notes',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Company $company): void {
            $member = Member::query()->find($company->member_id);
            if (! $member || ! $member->isOwner()) {
                throw ValidationException::withMessages([
                    'member_id' => [__('Il member deve essere un account owner (member principale).')],
                ]);
            }
        });
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function webDomains(): HasMany
    {
        return $this->hasMany(WebDomain::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'member_id',
                'name',
                'legal_name',
                'vat_number',
                'email',
                'phone',
                'pec',
                'sdi_recipient_code',
                'address',
                'city',
                'postal_code',
                'province',
                'country',
                'notes',
                'is_default',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
