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
        Schema::create('custom_permissions', function (Blueprint $table) {
            $table->id()->comment('Identificativo permesso custom');
            $table->string('permissionable_type')->comment('Tipo modello polimorfico (classe)');
            $table->unsignedBigInteger('permissionable_id')->comment('ID record sul modello polimorfico');
            $table->string('domain')->comment('Ambito funzionale (es. modulo o area applicativa)');
            $table->string('permission')->comment('Azione (es. index, create, update, delete)');
            $table->boolean('granted')->default(true)->comment('true = concesso, false = negato esplicito');
            $table->foreignId('granted_by')->nullable()->comment('Utente che ha concesso il permesso');
            $table->text('notes')->nullable()->comment('Motivazione o dettaglio');
            $table->timestamp('expires_at')->nullable()->comment('Scadenza opzionale del permesso');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('custom_permissions', function (Blueprint $table) {
            $table->index(['permissionable_type', 'permissionable_id']);
            $table->index(['domain', 'permission']);
            $table->index('granted_by');
            $table->index('expires_at');
            $table->index('deleted_at');

            $table->foreign('granted_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->unique(['permissionable_type', 'permissionable_id', 'domain', 'permission'], 'unique_custom_permission');
        });

        DB::statement('ALTER TABLE custom_permissions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE custom_permissions COMMENT = 'Permessi granulari polimorfici oltre a Spatie.'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('custom_permissions');
    }
};
