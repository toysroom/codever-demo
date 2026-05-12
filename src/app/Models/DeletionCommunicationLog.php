<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class DeletionCommunicationLog extends Model
{
    protected $fillable = [
        'subject_type',
        'subject_id',
        'subject_label',
        'caused_by_user_id',
        'recipient_email',
        'email_sent_at',
        'notification_sent_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_sent_at' => 'datetime',
            'notification_sent_at' => 'datetime',
        ];
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function causedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'caused_by_user_id');
    }
}
