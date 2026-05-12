<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('web_domains', function (Blueprint $table): void {
            $table->text('wp_connector_token')->nullable()->after('stack')->comment('Token condiviso con il plugin WP Zelante (cifrato a livello app)');
        });
    }

    public function down(): void
    {
        Schema::table('web_domains', function (Blueprint $table): void {
            $table->dropColumn('wp_connector_token');
        });
    }
};
