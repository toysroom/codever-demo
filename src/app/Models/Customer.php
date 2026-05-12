<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Customer extends Model
{
    use BelongsToAccount, HasFactory, LogsActivity, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'member_id',
        'external_code',
        'company_name',
        'reference_person',
        'first_name',
        'last_name',
        'vat_number',
        'fiscal_code',
        'phone',
        'mobile_phone',
        'fax',
        'contact_email',
        'pec',
        'sdi_recipient_code',
        'website',
        'notes',
        'entity_type',
        'bank_name',
        'iban',
        'address',
        'street',
        'city',
        'postal_code',
        'province',
        'country',
        'custom_fields',
        'is_active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'custom_fields' => 'array',
            'is_active' => 'boolean',
        ];
    }

    // Relazioni
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(CustomerContact::class)->orderBy('sort_order')->orderBy('id');
    }

    public function crmNotes(): HasMany
    {
        return $this->hasMany(CustomerCrmNote::class)->orderByDesc('id');
    }

    public function customerTypes(): BelongsToMany
    {
        return $this->belongsToMany(CustomerType::class, 'customer_customer_type')->withTimestamps();
    }

    // Helper
    public function fullName(): string
    {
        $company = trim((string) $this->company_name);

        return $company !== '' ? $company : trim("{$this->first_name} {$this->last_name}");
    }

    // Activity Log
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'external_code',
                'company_name',
                'reference_person',
                'first_name',
                'last_name',
                'vat_number',
                'fiscal_code',
                'member_id',
                'phone',
                'mobile_phone',
                'fax',
                'contact_email',
                'pec',
                'sdi_recipient_code',
                'website',
                'notes',
                'entity_type',
                'bank_name',
                'iban',
                'address',
                'street',
                'city',
                'postal_code',
                'province',
                'country',
                'is_active',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
