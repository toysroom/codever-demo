<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Preferenze applicative (chiave univoca, valore testuale, tipo per la UI).
     */
    public function up(): void
    {
        Schema::create('preferences', function (Blueprint $table): void {
            $table->id()->comment('Identificativo preferenza');
            $table->string('code')->comment('Codice stabile per codice applicativo');
            $table->string('name')->comment('Nome leggibile');
            $table->text('value')->nullable()->comment('Valore corrente');
            $table->text('notes')->nullable()->comment('Note per admin');
            $table->string('type', 32)->default('text')->comment('Tipo dato per widget UI');
            $table->string('category', 64)->nullable()->comment('Raggruppamento navigazione');
            $table->timestamps();
        });

        Schema::table('preferences', function (Blueprint $table): void {
            $table->unique('code');
            $table->index('category');
        });

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE preferences COMMENT = 'Parametri configurabili globali / per area.'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('preferences');
    }
};
