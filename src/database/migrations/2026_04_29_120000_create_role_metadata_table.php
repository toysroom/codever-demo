<?php

use App\Models\Role;
use App\Models\RoleMetadata;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_metadata', function (Blueprint $table): void {
            $table->id()->comment('Identificativo metadati ruolo');
            $table->foreignId('role_id')->comment('Ruolo Spatie collegato (1:1)');
            $table->boolean('is_active')->default(true)->comment('Ruolo utilizzabile in assegnazioni');
            $table->boolean('is_disabled')->default(false)->comment('Ruolo disabilitato a livello applicativo');
            $table->unsignedInteger('priority')->default(10)->comment('Priorità di ordinamento nelle liste');
            $table->text('description')->nullable()->comment('Descrizione funzionale del ruolo');
            $table->timestamps();
        });

        Schema::table('role_metadata', function (Blueprint $table): void {
            $table->foreign('role_id')
                ->references('id')
                ->on('roles')
                ->cascadeOnDelete();
            $table->unique('role_id');
        });

        if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE role_metadata COMMENT = 'Estensioni applicative sui ruoli Spatie.'");
        }

        foreach (Role::query()->cursor() as $role) {
            RoleMetadata::query()->firstOrCreate(
                ['role_id' => $role->id],
                [
                    'is_active' => true,
                    'is_disabled' => in_array($role->name, ['admin', 'customer'], true),
                    'priority' => Role::defaultPriorityForName($role->name),
                    'description' => null,
                ],
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('role_metadata');
    }
};
