<?php

namespace App\Mail;

use App\Models\DeletionCommunicationLog;
use Illuminate\Bus\Queueable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RecordDeletedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public DeletionCommunicationLog $log,
        public Model $deletedModel,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: __('ui.deletion_communication.mail_subject'),
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.record-deleted',
        );
    }
}
