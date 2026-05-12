<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('web_domain_emails', function (Blueprint $table): void {
            $table->id()->comment('Identificativo indirizzo censito');
            $table->foreignId('web_domain_id')->comment('Dominio di riferimento');
            $table->string('label')->nullable()->comment('Ruolo o alias leggibile');
            $table->string('email')->comment('Indirizzo email completo');
            $table->string('purpose', 32)->nullable()->comment('Scopo: contact, technical, billing, other');
            $table->text('notes')->nullable()->comment('Note');
            $table->timestamps();
        });

        Schema::table('web_domain_emails', function (Blueprint $table): void {
            $table->foreign('web_domain_id')
                ->references('id')
                ->on('web_domains')
                ->cascadeOnDelete();

            $table->index('web_domain_id');
        });

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE web_domain_emails COMMENT = 'Indirizzi email associati a un dominio gestito.'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('web_domain_emails');
    }
};
