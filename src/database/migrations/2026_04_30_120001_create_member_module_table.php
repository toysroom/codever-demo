<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_module', function (Blueprint $table) {
            $table->id()->comment('Identificativo riga abbonamento modulo');
            $table->foreignId('member_id')->comment('Tenant sottoscrittore');
            $table->foreignId('module_id')->comment('Modulo attivato');
            $table->string('status', 32)->default('active')->comment('Stato sottoscrizione (active, cancelled, …)');
            $table->timestamp('starts_at')->nullable()->comment('Inizio validità');
            $table->timestamp('ends_at')->nullable()->comment('Fine validità');
            $table->string('stripe_price_id')->nullable()->comment('Price ID Stripe');
            $table->string('stripe_subscription_item_id')->nullable()->comment('Subscription item Stripe');
            $table->timestamps();
        });

        Schema::table('member_module', function (Blueprint $table) {
            $table->foreign('member_id')
                ->references('id')
                ->on('members')
                ->cascadeOnDelete();

            $table->foreign('module_id')
                ->references('id')
                ->on('modules')
                ->cascadeOnDelete();

            $table->unique(['member_id', 'module_id']);
        });

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE member_module COMMENT = 'Pivot: moduli attivi per member con stato billing.'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('member_module');
    }
};
