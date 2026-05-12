<?php

namespace App\Notifications;

use App\Models\DeletionCommunicationLog;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class RecordDeletedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public DeletionCommunicationLog $log,
        public string $modelClassBase,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => __('ui.deletion_communication.notification_title'),
            'body' => __('ui.deletion_communication.notification_body', ['label' => $this->log->subject_label]),
            'subject_label' => $this->log->subject_label,
            'deletion_log_id' => $this->log->id,
            'model_type' => $this->modelClassBase,
            'href' => filled($this->id)
                ? route('notifications.index', ['notification' => $this->id])
                : route('notifications.index'),
        ];
    }
}
