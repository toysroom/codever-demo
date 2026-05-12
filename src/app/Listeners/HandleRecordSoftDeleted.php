<?php

namespace App\Listeners;

use App\Events\RecordSoftDeleted;
use App\Jobs\SendRecordDeletedMailJob;
use App\Models\DeletionCommunicationLog;
use App\Models\User;
use App\Notifications\RecordDeletedNotification;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class HandleRecordSoftDeleted
{
    public function handle(RecordSoftDeleted $event): void
    {
        $model = $event->model;
        $causer = $event->causer;

        $subjectLabel = $this->resolveSubjectLabel($model);

        $log = DeletionCommunicationLog::query()->create([
            'subject_type' => $model->getMorphClass(),
            'subject_id' => $model->getKey(),
            'subject_label' => $subjectLabel,
            'caused_by_user_id' => $causer?->id,
        ]);

        $recipient = (string) (config('zelante.deletion_alert_mail_to') ?: ($causer?->email ?? ''));

        Log::info('record_soft_deleted_communication_start', [
            'deletion_log_id' => $log->id,
            'subject_type' => $log->subject_type,
            'subject_id' => $log->subject_id,
        ]);

        if ($recipient !== '') {
            SendRecordDeletedMailJob::dispatch($log->id, $recipient, $model::class, (string) $model->getKey());
        } else {
            Log::warning('record_soft_deleted_email_skipped_no_recipient', [
                'deletion_log_id' => $log->id,
            ]);
        }

        if ($causer instanceof User) {
            try {
                $causer->notify(new RecordDeletedNotification($log->fresh(), class_basename($model::class)));
                $log->update(['notification_sent_at' => now()]);
                Log::info('record_soft_deleted_notification_sent', [
                    'deletion_log_id' => $log->id,
                    'user_id' => $causer->id,
                ]);
            } catch (\Throwable $e) {
                Log::error('record_soft_deleted_notification_failed', [
                    'deletion_log_id' => $log->id,
                    'error' => $e->getMessage(),
                ]);
            }
        } else {
            Log::info('record_soft_deleted_notification_skipped_no_causer', [
                'deletion_log_id' => $log->id,
            ]);
        }
    }

    private function resolveSubjectLabel(Model $model): string
    {
        $label = match (true) {
            isset($model->name) && is_string($model->name) && $model->name !== '' => $model->name,
            isset($model->label) && is_string($model->label) && $model->label !== '' => $model->label,
            isset($model->title) && is_string($model->title) && $model->title !== '' => $model->title,
            default => class_basename($model::class).' #'.$model->getKey(),
        };

        return Str::limit($label, 255);
    }
}
