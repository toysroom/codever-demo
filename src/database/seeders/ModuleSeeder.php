<?php

namespace Database\Seeders;

use App\Services\ModuleCatalogSyncService;
use Illuminate\Database\Seeder;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        app(ModuleCatalogSyncService::class)->syncAllFromFilesystem();
    }
}
