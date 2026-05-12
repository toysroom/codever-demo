<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('web_domains', function (Blueprint $table): void {
            $table->id()->comment('Identificativo dominio monitorato');
            $table->foreignId('member_id')->comment('Tenant di competenza');
            $table->foreignId('customer_id')->comment('Cliente proprietario logico');
            $table->foreignId('company_id')->comment('Società intestataria / fatturazione');
            $table->string('hostname', 512)->comment('FQDN o host normalizzato');
            $table->text('notes')->nullable()->comment('Note operative');
            $table->json('last_scan')->nullable()->comment('Esito ultima scansione (JSON)');
            $table->text('stack')->nullable()->comment('Stack tecnologico rilevato (testo)');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('web_domains', function (Blueprint $table): void {
            $table->foreign('member_id')
                ->references('id')
                ->on('members')
                ->cascadeOnDelete();

            $table->foreign('customer_id')
                ->references('id')
                ->on('customers')
                ->cascadeOnDelete();

            $table->foreign('company_id')
                ->references('id')
                ->on('companies')
                ->cascadeOnDelete();

            $table->index('member_id');
            $table->index('customer_id');
            $table->index('company_id');
            $table->index('deleted_at');
            $table->index(['member_id', 'deleted_at']);
            $table->index(['member_id', 'hostname']);
        });

        DB::statement('ALTER TABLE web_domains CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE web_domains COMMENT = 'Domini/siti gestiti nel modulo Web per cliente.'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('web_domains');
    }
};
