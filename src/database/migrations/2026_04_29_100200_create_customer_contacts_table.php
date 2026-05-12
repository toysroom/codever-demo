<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_contacts', function (Blueprint $table) {
            $table->id()->comment('Identificativo contatto');
            $table->foreignId('customer_id')->comment('Cliente anagrafico di riferimento');
            $table->string('type', 32)->comment('Tipo contatto (es. email, phone, pec)');
            $table->string('label')->nullable()->comment('Etichetta descrittiva opzionale');
            $table->string('value', 500)->comment('Valore del contatto (indirizzo, numero, …)');
            $table->unsignedSmallInteger('sort_order')->default(0)->comment('Ordinamento in UI');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('customer_contacts', function (Blueprint $table) {
            $table->foreign('customer_id')
                ->references('id')
                ->on('customers')
                ->cascadeOnDelete();

            $table->index(['customer_id', 'sort_order']);
        });

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE customer_contacts COMMENT = 'Recapiti multipli associati a un cliente.'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_contacts');
    }
};
