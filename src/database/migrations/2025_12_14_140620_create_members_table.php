<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->id()->comment('Identificativo tenant/member');
            $table->foreignId('user_id')->comment('Utente di login collegato (1:1)');
            $table->foreignId('parent_member_id')->nullable()->comment('Member padre in gerarchia rivenditori/sub-account');
            $table->foreignId('license_plan_id')->nullable()->comment('Piano licenza attivo');
            $table->boolean('is_owner')->default(false)->comment('Indica se è owner del proprio albero tenant');
            $table->string('company_name')->nullable()->comment('Ragione sociale mostrata in fatturazione/UI');
            $table->string('company_vat', 50)->nullable()->comment('Partita IVA azienda');
            $table->string('first_name')->nullable()->comment('Nome referente');
            $table->string('last_name')->nullable()->comment('Cognome referente');
            $table->timestamp('subscription_started_at')->nullable()->comment('Inizio effettivo abbonamento');
            $table->timestamp('subscription_ends_at')->nullable()->comment('Fine abbonamento (rinnovo/scadenza)');
            $table->timestamp('trial_ends_at')->nullable()->comment('Fine periodo trial');
            $table->boolean('is_trial')->default(false)->comment('Member in stato trial');
            $table->integer('max_customers')->nullable()->comment('Override limite clienti rispetto al piano');
            $table->integer('max_sub_members')->nullable()->comment('Override limite sub-member rispetto al piano');
            $table->json('settings')->nullable()->comment('Impostazioni tenant serializzate');
            $table->json('permissions')->nullable()->comment('Snapshot permessi custom aggiuntivi');
            $table->string('stripe_customer_id')->nullable()->comment('ID cliente Stripe');
            $table->string('stripe_subscription_id')->nullable()->comment('ID subscription Stripe attiva');
            $table->string('subscription_status', 20)->nullable()->comment('Stato subscription (es. active, past_due)');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('members', function (Blueprint $table) {
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
            $table->unique('user_id');

            $table->foreign('parent_member_id')
                ->references('id')
                ->on('members')
                ->cascadeOnDelete();

            $table->foreign('license_plan_id')
                ->references('id')
                ->on('license_plans')
                ->nullOnDelete();

            $table->index('parent_member_id');
            $table->index('license_plan_id');
            $table->index('is_owner');
            $table->index('subscription_status');
            $table->index('is_trial');
            $table->index('deleted_at');
            $table->index(['is_owner', 'deleted_at']);
        });

        DB::statement('ALTER TABLE members CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE members COMMENT = 'Tenant: aziende o organizzazioni con propri utenti e clienti.'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
