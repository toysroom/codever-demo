<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_crm_notes', function (Blueprint $table) {
            $table->id()->comment('Identificativo nota CRM');
            $table->foreignId('customer_id')->comment('Cliente collegato');
            $table->foreignId('user_id')->comment('Autore della nota (utente applicativo)');
            $table->text('body')->comment('Testo della nota');
            $table->timestamp('reminder_at')->nullable()->comment('Data/ora promemoria');
            $table->timestamp('reminder_notified_at')->nullable()->comment('Quando è stato inviato il promemoria');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('customer_crm_notes', function (Blueprint $table) {
            $table->foreign('customer_id')
                ->references('id')
                ->on('customers')
                ->cascadeOnDelete();

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();

            $table->index(['reminder_at', 'reminder_notified_at']);
            $table->index('customer_id');
        });

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE customer_crm_notes COMMENT = 'Note e follow-up CRM su cliente.'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_crm_notes');
    }
};
