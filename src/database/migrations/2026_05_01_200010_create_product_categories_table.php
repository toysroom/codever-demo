<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_categories', function (Blueprint $table) {
            $table->id()->comment('Identificativo categoria prodotto');
            $table->foreignId('member_id')->comment('Tenant proprietario');
            $table->foreignId('parent_id')->nullable()->comment('Categoria padre (albero)');
            $table->string('name')->comment('Nome categoria');
            $table->unsignedInteger('sort_order')->default(0)->comment('Ordinamento tra sibling');
            $table->boolean('is_active')->default(true)->comment('Categoria visibile in cataloghi');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('product_categories', function (Blueprint $table) {
            $table->foreign('member_id')
                ->references('id')
                ->on('members')
                ->cascadeOnDelete();

            $table->foreign('parent_id')
                ->references('id')
                ->on('product_categories')
                ->nullOnDelete();

            $table->index('member_id');
            $table->index('parent_id');
            $table->index('deleted_at');
            $table->index(['member_id', 'deleted_at']);
            $table->index(['member_id', 'is_active']);
        });

        DB::statement('ALTER TABLE product_categories CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE product_categories COMMENT = 'Gerarchia categorie prodotto per tenant.'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('product_categories');
    }
};
