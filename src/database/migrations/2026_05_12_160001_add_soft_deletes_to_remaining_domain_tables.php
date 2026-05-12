<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Modelli di dominio senza soft delete (esclusi: Role Spatie, log tecnici FTP test).
     */
    public function up(): void
    {
        $tables = [
            'web_hosting_providers',
            'web_servers',
            'modules',
            'permission_descriptions',
            'preferences',
            'web_domain_emails',
            'web_domain_ftp_accounts',
            'web_domain_database_connections',
            'role_metadata',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && ! Schema::hasColumn($table, 'deleted_at')) {
                Schema::table($table, function (Blueprint $blueprint): void {
                    $blueprint->softDeletes();
                });
            }
        }
    }

    public function down(): void
    {
        $tables = [
            'web_hosting_providers',
            'web_servers',
            'modules',
            'permission_descriptions',
            'preferences',
            'web_domain_emails',
            'web_domain_ftp_accounts',
            'web_domain_database_connections',
            'role_metadata',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'deleted_at')) {
                Schema::table($table, function (Blueprint $blueprint): void {
                    $blueprint->dropSoftDeletes();
                });
            }
        }
    }
};
