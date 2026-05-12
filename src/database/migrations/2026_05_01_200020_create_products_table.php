<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id()->comment('Identificativo prodotto/servizio erogabile');
            $table->foreignId('member_id')->comment('Tenant titolare');
            $table->foreignId('product_category_id')->nullable()->comment('Categoria merceologica');
            $table->string('code')->comment('SKU o codice interno univoco per tenant');
            $table->string('name')->comment('Denominazione commerciale');
            $table->text('invoice_text')->nullable()->comment('Descrizione su documenti fiscali');
            $table->string('revenue_code', 128)->nullable()->comment('Codice ricavo/contabile');
            $table->text('revenue_description')->nullable()->comment('Descrizione ricavo');
            $table->string('sales_code', 128)->nullable()->comment('Codice vendita/CRM');
            $table->text('sales_description')->nullable()->comment('Descrizione vendita');
            $table->string('line_kind', 32)->nullable()->comment('Tipo riga (servizio, merce, abbonamento, …)');
            $table->unsignedInteger('sort_order')->default(0)->comment('Ordinamento cataloghi');
            $table->boolean('is_active')->default(true)->comment('Prodotto ordinabile');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->foreign('member_id')
                ->references('id')
                ->on('members')
                ->cascadeOnDelete();

            $table->foreign('product_category_id')
                ->references('id')
                ->on('product_categories')
                ->nullOnDelete();

            $table->index('member_id');
            $table->index('product_category_id');
            $table->index('deleted_at');
            $table->index(['member_id', 'deleted_at']);
            $table->index(['member_id', 'is_active']);
            $table->unique(['member_id', 'code']);
        });

        DB::statement('ALTER TABLE products CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE products COMMENT = 'Catalogo prodotti/servizi del tenant.'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
