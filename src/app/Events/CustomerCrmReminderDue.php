<?php

namespace App\Events;

use App\Models\CustomerCrmNote;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CustomerCrmReminderDue
{
    use Dispatchable, SerializesModels;

    public function __construct(public CustomerCrmNote $note) {}
}
