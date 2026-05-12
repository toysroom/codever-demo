<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('web_domains', function (Blueprint $table): void {
            $table->json('wp_version_audit')->nullable()->after('wp_connector_token');
        });
    }

    public function down(): void
    {
        Schema::table('web_domains', function (Blueprint $table): void {
            $table->dropColumn('wp_version_audit');
        });
    }
};
