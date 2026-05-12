<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id()->comment('Identificativo cliente CRM');
            $table->foreignId('user_id')->comment('Utente di accesso portale cliente (1:1)');
            $table->foreignId('member_id')->comment('Tenant di appartenenza');
            $table->boolean('is_active')->default(true)->comment('Cliente attivo per operatività');
            $table->string('external_code', 64)->nullable()->comment('Codice esterno / integrazione');
            $table->string('company_name')->nullable()->comment('Ragione sociale');
            $table->string('reference_person')->nullable()->comment('Persona di riferimento commerciale');
            $table->string('first_name')->comment('Nome anagrafico');
            $table->string('last_name')->comment('Cognome anagrafico');
            $table->string('vat_number', 32)->nullable()->comment('Partita IVA');
            $table->string('fiscal_code', 32)->nullable()->comment('Codice fiscale');
            $table->string('phone', 50)->nullable()->comment('Telefono fisso');
            $table->string('mobile_phone', 50)->nullable()->comment('Cellulare');
            $table->string('fax', 50)->nullable()->comment('Fax');
            $table->string('contact_email')->nullable()->comment('Email di contatto');
            $table->string('pec')->nullable()->comment('PEC');
            $table->string('sdi_recipient_code', 16)->nullable()->comment('Codice destinatario SDI');
            $table->string('website', 512)->nullable()->comment('Sito web');
            $table->text('notes')->nullable()->comment('Note libere');
            $table->string('entity_type', 64)->nullable()->comment('Tipologia soggetto (azienda, privato, …)');
            $table->string('bank_name')->nullable()->comment('Nome istituto bancario');
            $table->string('iban', 34)->nullable()->comment('IBAN');
            $table->text('address')->nullable()->comment('Indirizzo completo (legacy/testo libero)');
            $table->string('street')->nullable()->comment('Via e numero civico');
            $table->string('city', 120)->nullable()->comment('Città');
            $table->string('postal_code', 32)->nullable()->comment('CAP');
            $table->string('province', 16)->nullable()->comment('Provincia / stato');
            $table->string('country', 120)->nullable()->comment('Nazione');
            $table->json('custom_fields')->nullable()->comment('Campi personalizzati tenant');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
            $table->unique('user_id');

            $table->foreign('member_id')
                ->references('id')
                ->on('members')
                ->cascadeOnDelete();

            $table->index('member_id');
            $table->index('deleted_at');
            $table->index(['member_id', 'deleted_at']);
            $table->index('is_active');
            $table->index('external_code');
            $table->index('vat_number');
        });

        DB::statement('ALTER TABLE customers CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE customers COMMENT = 'Anagrafiche clienti appartenenti a un member (tenant).'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
