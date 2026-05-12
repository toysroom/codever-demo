<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_lists', function (Blueprint $table) {
            $table->id()->comment('Identificativo listino');
            $table->foreignId('member_id')->comment('Tenant proprietario del listino');
            $table->string('name')->comment('Nome commerciale listino');
            $table->string('code', 64)->nullable()->comment('Codice interno o contabile');
            $table->char('currency', 3)->default('EUR')->comment('ISO 4217 valuta prezzi');
            $table->date('valid_from')->nullable()->comment('Decorrenza validità');
            $table->date('valid_to')->nullable()->comment('Termine validità');
            $table->boolean('is_default')->default(false)->comment('Listino predefinito per il tenant');
            $table->boolean('is_active')->default(true)->comment('Listino utilizzabile in ordini/preventivi');
            $table->text('notes')->nullable()->comment('Note');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('price_lists', function (Blueprint $table) {
            $table->foreign('member_id')
                ->references('id')
                ->on('members')
                ->cascadeOnDelete();

            $table->index('member_id');
            $table->index('deleted_at');
            $table->index(['member_id', 'deleted_at']);
            $table->index(['member_id', 'is_active']);
        });

        DB::statement('ALTER TABLE price_lists CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE price_lists COMMENT = 'Listini prezzi per tenant con validità temporale.'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('price_lists');
    }
};
