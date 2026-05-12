<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('web_hosting_providers', function (Blueprint $table): void {
            $table->id()->comment('Identificativo hosting provider noto');
            $table->string('slug', 96)->comment('Slug stabile (es. vendor API)');
            $table->string('name', 160)->comment('Nome commerciale');
            $table->string('website_url')->nullable()->comment('Sito documentazione o vendor');

            $table->timestamps();
        });

        Schema::table('web_hosting_providers', function (Blueprint $table): void {
            $table->unique('slug');
        });

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE web_hosting_providers COMMENT = 'Anagrafica provider di hosting (normalizzazione).'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('web_hosting_providers');
    }
};
