<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id()->comment('Identificativo sede/società');
            $table->foreignId('member_id')->comment('Tenant proprietario');
            $table->string('name')->comment('Nome commerciale breve');
            $table->string('legal_name')->nullable()->comment('Ragione sociale completa');
            $table->string('vat_number', 50)->nullable()->comment('Partita IVA');
            $table->string('email')->nullable()->comment('Email amministrativa');
            $table->string('phone', 50)->nullable()->comment('Telefono');
            $table->string('pec')->nullable()->comment('PEC');
            $table->string('sdi_recipient_code', 10)->nullable()->comment('Codice destinatario SDI');
            $table->text('address')->nullable()->comment('Indirizzo (testo libero)');
            $table->string('city')->nullable()->comment('Città');
            $table->string('postal_code', 16)->nullable()->comment('CAP');
            $table->string('province', 8)->nullable()->comment('Provincia');
            $table->string('country', 2)->nullable()->default('IT')->comment('Codice paese ISO-3166 alpha-2');
            $table->text('notes')->nullable()->comment('Note interne');
            $table->boolean('is_default')->default(false)->comment('Sede predefinita per il tenant');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->foreign('member_id')
                ->references('id')
                ->on('members')
                ->cascadeOnDelete();

            $table->index(['member_id', 'deleted_at']);
            $table->index(['member_id', 'is_default']);
        });

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE companies COMMENT = 'Sedi legali / operative collegate al member.'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
