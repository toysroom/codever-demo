<?php

namespace App\Mail;

use App\Models\CustomerCrmNote;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CustomerCrmReminderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public CustomerCrmNote $note)
    {
        $this->note->loadMissing(['customer.user']);
    }

    public function envelope(): Envelope
    {
        $customer = $this->note->customer;

        return new Envelope(
            subject: __('Promemoria CRM: :name', ['name' => $customer?->fullName() ?? __('Cliente')]),
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.customer-crm-reminder',
            with: [
                'note' => $this->note,
                'customer' => $this->note->customer,
            ],
        );
    }
}
