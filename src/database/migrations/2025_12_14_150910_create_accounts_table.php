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
        Schema::create('accounts', function (Blueprint $table) {
            $table->id()->comment('Identificativo profilo staff (non tenant)');
            $table->foreignId('user_id')->comment('Utente di login collegato (1:1)');
            $table->string('first_name')->nullable()->comment('Nome');
            $table->string('last_name')->nullable()->comment('Cognome');
            $table->string('department')->nullable()->comment('Reparto o unità organizzativa');
            $table->string('role_level', 50)->nullable()->comment('Livello ruolo applicativo (es. super_admin, admin)');
            $table->text('notes')->nullable()->comment('Note HR / interne sul profilo');
            $table->timestamp('last_login_at')->nullable()->comment('Ultimo accesso registrato');
            $table->json('settings')->nullable()->comment('Preferenze UI e flag personali');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('accounts', function (Blueprint $table) {
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
            $table->unique('user_id');

            $table->index('department');
            $table->index('role_level');
            $table->index('deleted_at');
            $table->index(['role_level', 'deleted_at']);
        });

        DB::statement('ALTER TABLE accounts CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE accounts COMMENT = 'Profili utenti interni (staff) con permessi amministrativi.'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
