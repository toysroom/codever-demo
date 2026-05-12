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
        Schema::create('license_plans', function (Blueprint $table) {
            $table->id()->comment('Identificativo piano licenza');
            $table->string('name')->comment('Nome commerciale del piano');
            $table->string('slug')->comment('Slug URL univoco del piano');
            $table->string('package_tier', 32)->nullable()->comment('Codice tier pacchetto (es. tier commerciale interno)');
            $table->text('description')->nullable()->comment('Descrizione estesa del piano');
            $table->decimal('price', 10, 2)->nullable()->comment('Prezzo di listino (valuta di business)');
            $table->string('billing_period', 20)->nullable()->comment('Periodicità fatturazione (es. monthly, yearly)');
            $table->unsignedSmallInteger('annual_term_months')->default(12)->comment('Durata standard del contratto annuale in mesi');
            $table->integer('trial_days')->default(0)->comment('Giorni di trial inclusi nel piano');
            $table->integer('max_customers')->nullable()->comment('Limite clienti gestibili (null = illimitato)');
            $table->integer('max_sub_members')->nullable()->comment('Limite sub-member/collaboratori (null = illimitato)');
            $table->json('features')->nullable()->comment('Funzionalità incluse in formato JSON');
            $table->boolean('is_active')->default(true)->comment('Piano selezionabile per nuove sottoscrizioni');
            $table->integer('sort_order')->default(0)->comment('Ordinamento di visualizzazione nel catalogo');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('license_plans', function (Blueprint $table) {
            $table->unique('slug');
            $table->unique('package_tier');
            $table->index('is_active');
            $table->index('sort_order');
            $table->index('annual_term_months');
            $table->index(['is_active', 'sort_order']);
        });

        DB::statement('ALTER TABLE license_plans CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE license_plans COMMENT = 'Catalogo piani di licenza/abbonamento tenant.'");
        }

        Schema::create('license_plan_perpetual_codes', function (Blueprint $table) {
            $table->id()->comment('Identificativo codice perpetuo');
            $table->foreignId('license_plan_id')->comment('Piano associato al codice');
            $table->string('code', 64)->comment('Codice promo/licenza perpetuo (univoco)');
            $table->text('notes')->nullable()->comment('Note interne sul codice');
            $table->boolean('is_active')->default(true)->comment('Codice utilizzabile / revocabile');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('license_plan_perpetual_codes', function (Blueprint $table) {
            $table->foreign('license_plan_id')
                ->references('id')
                ->on('license_plans')
                ->cascadeOnDelete();

            $table->unique('code');
            $table->index(['license_plan_id', 'is_active']);
            $table->index('deleted_at');
        });

        DB::statement('ALTER TABLE license_plan_perpetual_codes CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE license_plan_perpetual_codes COMMENT = 'Codici perpetui associati ai piani licenza.'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('license_plan_perpetual_codes');
        Schema::dropIfExists('license_plans');
    }
};
