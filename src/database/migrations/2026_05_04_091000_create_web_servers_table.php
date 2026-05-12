<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('web_servers', function (Blueprint $table): void {
            $table->id()->comment('Identificativo server/hosting gestito');
            $table->foreignId('member_id')->comment('Tenant proprietario');
            $table->foreignId('web_hosting_provider_id')->comment('Provider normalizzato');

            $table->string('label', 160)->nullable()->comment('Nome descrittivo server in UI');
            $table->string('host', 255)->comment('Hostname o IP pubblico');

            $table->text('notes')->nullable()->comment('Credenziali pannello, SSH, note runbook');

            $table->timestamps();
        });

        Schema::table('web_servers', function (Blueprint $table): void {
            $table->foreign('member_id')
                ->references('id')
                ->on('members')
                ->cascadeOnDelete();

            $table->foreign('web_hosting_provider_id')
                ->references('id')
                ->on('web_hosting_providers')
                ->restrictOnDelete();

            $table->index('member_id');
            $table->index('web_hosting_provider_id');
            $table->index(['member_id', 'host']);
        });

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE web_servers COMMENT = 'Server o pannelli hosting associati al tenant.'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('web_servers');
    }
};
