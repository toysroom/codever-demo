<?php

namespace App\Listeners;

use App\Events\CustomerCrmReminderDue;
use App\Mail\CustomerCrmReminderMail;
use App\Notifications\CustomerCrmReminderDatabaseNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendCustomerCrmReminder implements ShouldQueue
{
    public function handle(CustomerCrmReminderDue $event): void
    {
        $note = $event->note->loadMissing(['customer.user', 'author']);
        $user = $note->author;
        if (! $user) {
            return;
        }

        Mail::to($user)->queue(new CustomerCrmReminderMail($note));
        $user->notify(new CustomerCrmReminderDatabaseNotification($note));
    }
}
