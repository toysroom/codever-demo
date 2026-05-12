<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_types', function (Blueprint $table): void {
            $table->id()->comment('Identificativo tipologia cliente');
            $table->foreignId('member_id')->comment('Tenant che definisce la tipologia');
            $table->string('name')->comment('Nome tipologia (es. Lead, Cliente attivo)');
            $table->text('description')->nullable()->comment('Descrizione uso interno');
            $table->unsignedInteger('sort_order')->default(0)->comment('Ordinamento elenchi');
            $table->boolean('is_active')->default(true)->comment('Tipologia selezionabile');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('customer_types', function (Blueprint $table): void {
            $table->foreign('member_id')
                ->references('id')
                ->on('members')
                ->cascadeOnDelete();

            $table->index(['member_id', 'deleted_at']);
        });

        DB::statement('ALTER TABLE customer_types CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE customer_types COMMENT = 'Tipologie CRM definite per tenant.'");
        }

        Schema::create('customer_customer_type', function (Blueprint $table): void {
            $table->id()->comment('Identificativo associazione');
            $table->foreignId('customer_id')->comment('Cliente');
            $table->foreignId('customer_type_id')->comment('Tipologia assegnata');
            $table->timestamps();
        });

        Schema::table('customer_customer_type', function (Blueprint $table): void {
            $table->foreign('customer_id')
                ->references('id')
                ->on('customers')
                ->cascadeOnDelete();

            $table->foreign('customer_type_id')
                ->references('id')
                ->on('customer_types')
                ->cascadeOnDelete();

            $table->unique(['customer_id', 'customer_type_id']);
        });

        DB::statement('ALTER TABLE customer_customer_type CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE customer_customer_type COMMENT = 'Pivot: tipologie assegnate ai clienti.'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_customer_type');
        Schema::dropIfExists('customer_types');
    }
};
