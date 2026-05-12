<?php

namespace App\Console\Commands;

use App\Events\CustomerCrmReminderDue;
use App\Models\CustomerCrmNote;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DispatchCustomerCrmReminders extends Command
{
    protected $signature = 'customer-crm:dispatch-reminders';

    protected $description = 'Invia promemoria CRM (eventi in coda: Mail + Notification) per note con reminder scaduto';

    public function handle(): int
    {
        $count = 0;

        DB::transaction(function () use (&$count): void {
            $notes = CustomerCrmNote::query()
                ->whereNotNull('reminder_at')
                ->where('reminder_at', '<=', now())
                ->whereNull('reminder_notified_at')
                ->whereHas('customer', fn ($q) => $q->withoutGlobalScope('account'))
                ->lockForUpdate()
                ->get();

            foreach ($notes as $note) {
                $note->forceFill(['reminder_notified_at' => now()])->save();
                event(new CustomerCrmReminderDue($note));
                $count++;
            }
        });

        if ($count > 0) {
            $this->info("Dispatched {$count} CRM reminder(s).");
        }

        return self::SUCCESS;
    }
}
