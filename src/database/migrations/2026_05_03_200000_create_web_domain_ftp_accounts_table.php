<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('web_domain_ftp_accounts', function (Blueprint $table): void {
            $table->id()->comment('Identificativo account FTP/SFTP');
            $table->foreignId('web_domain_id')->comment('Dominio di competenza');
            $table->string('label')->comment('Nome account in UI');
            $table->string('protocol', 16)->comment('Protocollo: sftp, ftp, ftps');
            $table->string('host')->comment('Hostname server');
            $table->unsignedSmallInteger('port')->nullable()->comment('Porta (default implicito per protocollo)');
            $table->string('username')->comment('Utente login');
            $table->text('password')->comment('Secret password/chiave (gestione sicurezza a livello app)');
            $table->string('remote_base_path', 1024)->default('')->comment('Path remoto root operativo');
            $table->boolean('is_default')->default(false)->comment('Account predefinito per deploy/backup');
            $table->text('notes')->nullable()->comment('Note operative');
            $table->timestamps();
        });

        Schema::table('web_domain_ftp_accounts', function (Blueprint $table): void {
            $table->foreign('web_domain_id')
                ->references('id')
                ->on('web_domains')
                ->cascadeOnDelete();

            $table->index('web_domain_id');
        });

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE web_domain_ftp_accounts COMMENT = 'Profili FTP/SFTP per dominio.'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('web_domain_ftp_accounts');
    }
};
