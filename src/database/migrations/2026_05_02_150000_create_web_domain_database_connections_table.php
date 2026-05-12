<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('web_domain_database_connections', function (Blueprint $table): void {
            $table->id()->comment('Identificativo credenziale DB');
            $table->foreignId('web_domain_id')->comment('Dominio a cui si riferisce');
            $table->string('label')->comment('Nome visualizzato (es. Produzione, Read replica)');
            $table->string('driver', 32)->comment('Driver PDO (mysql, pgsql, …)');
            $table->string('host')->comment('Hostname o IP del server DB');
            $table->unsignedSmallInteger('port')->nullable()->comment('Porta TCP');
            $table->string('database_name')->comment('Nome database/schema');
            $table->string('username')->comment('Utente connessione');
            $table->text('password')->comment('Password o secret (cifrato a livello app)');
            $table->string('charset', 64)->nullable()->comment('Charset connessione');
            $table->boolean('is_default')->default(false)->comment('Connessione predefinita per il dominio');
            $table->text('notes')->nullable()->comment('Note (es. permessi, limiti)');
            $table->timestamps();
        });

        Schema::table('web_domain_database_connections', function (Blueprint $table): void {
            $table->foreign('web_domain_id')
                ->references('id')
                ->on('web_domains')
                ->cascadeOnDelete();

            $table->index('web_domain_id');
        });

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE web_domain_database_connections COMMENT = 'Credenziali database collegate a un dominio.'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('web_domain_database_connections');
    }
};
