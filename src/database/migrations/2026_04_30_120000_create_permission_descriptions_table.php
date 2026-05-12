<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Testi descrittivi per i permessi Spatie (tabella `permissions` resta invariata).
     */
    public function up(): void
    {
        Schema::create('permission_descriptions', function (Blueprint $table): void {
            $table->id()->comment('Identificativo testo descrittivo');
            $table->foreignId('permission_id')->comment('Permesso Spatie collegato');
            $table->string('locale', 16)->default('it')->comment('Codice lingua (BCP-47 breve)');
            $table->text('description')->comment('Descrizione human-readable del permesso');
            $table->timestamps();
        });

        Schema::table('permission_descriptions', function (Blueprint $table): void {
            $table->foreign('permission_id')
                ->references('id')
                ->on('permissions')
                ->cascadeOnDelete();

            $table->unique(['permission_id', 'locale']);
        });

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE permission_descriptions COMMENT = 'Traduzioni/descrizioni permessi Spatie.'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('permission_descriptions');
    }
};
