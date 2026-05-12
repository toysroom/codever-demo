<?php

namespace App\Notifications;

use App\Models\CustomerCrmNote;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class CustomerCrmReminderDatabaseNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public CustomerCrmNote $note)
    {
        $this->note->loadMissing(['customer.user']);
    }

    /**
     * @return array<int, string>
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
        $customer = $this->note->customer;

        return [
            'title' => __('Promemoria CRM'),
            'body' => str($this->note->body)->limit(200)->toString(),
            'customer_id' => $customer?->id,
            'customer_name' => $customer?->fullName(),
            'note_id' => $this->note->id,
            'href' => $customer ? route('modules.customers.show', $customer) : null,
        ];
    }
}
