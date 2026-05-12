<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deletion_communication_logs', function (Blueprint $table) {
            $table->id();
            $table->morphs('subject');
            $table->string('subject_label');
            $table->foreignId('caused_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('recipient_email')->nullable();
            $table->timestamp('email_sent_at')->nullable();
            $table->timestamp('notification_sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deletion_communication_logs');
    }
};
