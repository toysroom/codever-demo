<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('web_domain_ftp_connection_test_logs', function (Blueprint $table): void {
            $table->id()->comment('Identificativo log test connessione');
            $table->unsignedBigInteger('web_domain_id')->comment('Dominio testato');
            $table->unsignedBigInteger('web_domain_ftp_account_id')->comment('Account FTP usato nel test');
            $table->string('kind', 32)->comment('Tipo operazione testata (es. login, list)');
            $table->boolean('success')->comment('Esito positivo o negativo');
            $table->text('message')->nullable()->comment('Dettaglio errore o messaggio diagnostico');
            $table->unsignedBigInteger('triggered_by_user_id')->nullable()->comment('Utente che ha avviato il test');
            $table->timestamp('created_at')->useCurrent()->comment('Momento esecuzione test');
        });

        Schema::table('web_domain_ftp_connection_test_logs', function (Blueprint $table): void {
            $table->foreign('web_domain_id', 'wd_ftplog_dom_fk')
                ->references('id')
                ->on('web_domains')
                ->cascadeOnDelete();

            $table->foreign('web_domain_ftp_account_id', 'wd_ftplog_acct_fk')
                ->references('id')
                ->on('web_domain_ftp_accounts')
                ->cascadeOnDelete();

            $table->foreign('triggered_by_user_id', 'wd_ftplog_user_fk')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->index(['web_domain_ftp_account_id', 'created_at'], 'wd_ftplog_acct_time_idx');
            $table->index('web_domain_id', 'wd_ftplog_dom_idx');
        });

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE web_domain_ftp_connection_test_logs COMMENT = 'Storico test raggiungibilità FTP/SFTP per dominio.'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('web_domain_ftp_connection_test_logs');
    }
};
