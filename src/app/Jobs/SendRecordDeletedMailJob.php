<?php

namespace App\Jobs;

use App\Mail\RecordDeletedMail;
use App\Models\DeletionCommunicationLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendRecordDeletedMailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $deletionLogId,
        public string $recipient,
        public string $subjectModelClass,
        public string $subjectKey,
    ) {}

    /**
     * @return list<string>
     */
    public function tags(): array
    {
        return [
            'deletion-mail',
            'log:'.$this->deletionLogId,
            'subject:'.class_basename($this->subjectModelClass).':'.$this->subjectKey,
        ];
    }

    public function displayName(): string
    {
        return 'SendRecordDeletedMailJob#'.$this->deletionLogId;
    }

    public function handle(): void
    {
        $log = DeletionCommunicationLog::query()->with('causedBy')->find($this->deletionLogId);
        if ($log === null) {
            Log::warning('send_record_deleted_mail_job_log_missing', [
                'deletion_log_id' => $this->deletionLogId,
            ]);

            throw (new ModelNotFoundException)->setModel(DeletionCommunicationLog::class, [$this->deletionLogId]);
        }

        $deletedModel = $this->resolveDeletedSubject();
        if ($deletedModel === null) {
            Log::error('send_record_deleted_mail_job_subject_missing', [
                'deletion_log_id' => $log->id,
                'subject_model_class' => $this->subjectModelClass,
                'subject_key' => $this->subjectKey,
            ]);

            throw (new ModelNotFoundException)->setModel($this->subjectModelClass, [$this->subjectKey]);
        }

        try {
            Mail::to($this->recipient)->send(new RecordDeletedMail($log->fresh(['causedBy']), $deletedModel));
            $log->update([
                'recipient_email' => $this->recipient,
                'email_sent_at' => now(),
            ]);
            Log::info('record_soft_deleted_email_sent', [
                'deletion_log_id' => $log->id,
                'recipient' => $this->recipient,
            ]);
        } catch (Throwable $e) {
            Log::error('record_soft_deleted_email_failed', [
                'deletion_log_id' => $log->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    private function resolveDeletedSubject(): ?Model
    {
        $modelClass = Relation::getMorphedModel($this->subjectModelClass) ?? $this->subjectModelClass;

        if (! class_exists($modelClass) || ! is_subclass_of($modelClass, Model::class)) {
            return null;
        }

        // Queue workers have no HTTP session: load by PK without tenant/soft-delete global scopes.
        /** @var Model|null */
        return $modelClass::query()->withoutGlobalScopes()->find($this->subjectKey);
    }
}
