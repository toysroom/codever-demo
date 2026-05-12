<?php

namespace App\Services;

use App\Models\Module;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class ModuleCatalogSyncService
{
    /**
     * Moduli rilevati sotto app/Modules: slug (snake) => nome cartella (StudlyCase).
     *
     * @return array<string, string>
     */
    public function discoverFilesystemModules(): array
    {
        $modulesPath = app_path('Modules');
        if (! File::isDirectory($modulesPath)) {
            return [];
        }

        $map = [];
        foreach (File::directories($modulesPath) as $path) {
            $folder = basename($path);
            if ($folder === '' || str_starts_with($folder, '.')) {
                continue;
            }
            $slug = Str::snake($folder);
            $map[$slug] = $folder;
        }
        ksort($map);

        return $map;
    }

    /**
     * Elenco slug (ordinati) presenti in app/Modules.
     *
     * @return list<string>
     */
    public function discoverSlugsFromFilesystem(): array
    {
        return array_keys($this->discoverFilesystemModules());
    }

    /**
     * Seed / aggiorna catalogo dal filesystem (ModuleSeeder).
     */
    public function syncAllFromFilesystem(): void
    {
        foreach ($this->discoverFilesystemModules() as $slug => $folder) {
            $defaults = $this->defaultsForSlug($slug);
            $existing = Module::query()->where('slug', $slug)->first();
            $metadata = array_merge(
                is_array($existing?->metadata) ? $existing->metadata : [],
                [
                    'source' => 'filesystem',
                    'folder' => $folder,
                ],
            );

            Module::query()->updateOrCreate(
                ['slug' => $slug],
                array_merge($defaults, [
                    'metadata' => $metadata,
                ]),
            );
        }
    }

    /**
     * A runtime: aggiunge cartelle nuove e aggiorna metadata folder/source sulle righe esistenti.
     */
    public function ensureFilesystemModulesRegistered(): void
    {
        foreach ($this->discoverFilesystemModules() as $slug => $folder) {
            $module = Module::query()->where('slug', $slug)->first();
            if (! $module) {
                Module::query()->create(array_merge($this->defaultsForSlug($slug), [
                    'slug' => $slug,
                    'metadata' => [
                        'source' => 'filesystem',
                        'folder' => $folder,
                    ],
                ]));

                continue;
            }

            $meta = is_array($module->metadata) ? $module->metadata : [];
            $next = array_merge($meta, [
                'source' => 'filesystem',
                'folder' => $folder,
            ]);

            if (($meta['folder'] ?? null) !== $folder || ($meta['source'] ?? null) !== 'filesystem') {
                $module->update(['metadata' => $next]);
            }
        }
    }

    /**
     * @return array{name: string, description: string|null, price: null, is_core: bool, is_active: bool, sort_order: int}
     */
    protected function defaultsForSlug(string $slug): array
    {
        return match ($slug) {
            'customers' => [
                'name' => 'Clienti',
                'description' => 'Gestione clienti CRM (per account)',
                'price' => null,
                'is_core' => true,
                'is_active' => true,
                'sort_order' => 10,
            ],
            'products' => [
                'name' => 'Prodotti e listini',
                'description' => 'Catalogo prodotti, categorie e listini prezzi (per account)',
                'price' => null,
                'is_core' => true,
                'is_active' => true,
                'sort_order' => 20,
            ],
            'web' => [
                'name' => 'Web',
                'description' => 'Domini e presenza web associati a clienti e aziende dell’account',
                'price' => null,
                'is_core' => false,
                'is_active' => true,
                'sort_order' => 30,
            ],
            default => [
                'name' => Str::title(str_replace('_', ' ', $slug)),
                'description' => null,
                'price' => null,
                'is_core' => false,
                'is_active' => false,
                'sort_order' => 100,
            ],
        };
    }
}
