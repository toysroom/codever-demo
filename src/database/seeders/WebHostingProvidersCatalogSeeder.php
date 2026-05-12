<?php

namespace Database\Seeders;

use App\Models\WebHostingProvider;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Catalogo sintetizzato da benchmark e operatori VPS/cloud diffusi — completabile via CRUD in app.
 */
class WebHostingProvidersCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $path = __DIR__.'/data/hosting_provider_names.json';
        if (! is_readable($path)) {
            $this->command?->warn('WebHostingProvidersCatalogSeeder: file catalogo non trovato: '.$path);

            return;
        }

        /** @var list<string>|null $names */
        $names = json_decode((string) file_get_contents($path), true);

        if (! is_array($names)) {
            $this->command?->error('WebHostingProvidersCatalogSeeder: JSON catalogo non valido.');

            return;
        }

        $occupied = [];

        foreach ($names as $name) {
            if (! is_string($name)) {
                continue;
            }

            $nameTrim = trim($name);
            if ($nameTrim === '') {
                continue;
            }

            $baseSlug = Str::slug($nameTrim);
            if ($baseSlug === '') {
                continue;
            }

            $slug = $baseSlug;
            $i = 2;
            while (isset($occupied[$slug])) {
                $slug = $baseSlug.'-'.$i;
                $i++;
            }
            $occupied[$slug] = true;

            WebHostingProvider::updateOrCreate(
                ['slug' => $slug],
                ['name' => $nameTrim],
            );
        }
    }
}
