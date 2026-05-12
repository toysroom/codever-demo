<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_prices', function (Blueprint $table) {
            $table->id()->comment('Identificativo prezzo per listino');
            $table->foreignId('product_id')->comment('Prodotto quotato');
            $table->foreignId('price_list_id')->comment('Listino di appartenenza');
            $table->decimal('amount', 15, 4)->comment('Prezzo unitario nella valuta del listino');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('product_prices', function (Blueprint $table) {
            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->cascadeOnDelete();

            $table->foreign('price_list_id')
                ->references('id')
                ->on('price_lists')
                ->cascadeOnDelete();

            $table->index('product_id');
            $table->index('price_list_id');
            $table->unique(['product_id', 'price_list_id']);
        });

        DB::statement('ALTER TABLE product_prices CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE product_prices COMMENT = 'Matrix prezzi: prodotto × listino.'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('product_prices');
    }
};
