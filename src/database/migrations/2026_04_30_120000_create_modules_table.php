<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('modules', function (Blueprint $table) {
            $table->id()->comment('Identificativo modulo vendibile');
            $table->string('slug')->comment('Slug tecnico univoco');
            $table->string('name')->comment('Nome commerciale');
            $table->text('description')->nullable()->comment('Descrizione marketing / funzionale');
            $table->decimal('price', 10, 2)->nullable()->comment('Prezzo listino modulo');
            $table->json('metadata')->nullable()->comment('Metadati add-on (feature flags, JSON)');
            $table->boolean('is_core')->default(false)->comment('Modulo incluso nel core (non disattivabile)');
            $table->boolean('is_active')->default(true)->comment('Modulo acquistabile / visibile');
            $table->unsignedSmallInteger('sort_order')->default(0)->comment('Ordinamento catalogo');
            $table->timestamps();
        });

        Schema::table('modules', function (Blueprint $table) {
            $table->unique('slug');
        });

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE modules COMMENT = 'Moduli funzionali attivabili per tenant.'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('modules');
    }
};
