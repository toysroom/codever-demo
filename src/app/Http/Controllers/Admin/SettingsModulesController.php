<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\Module;
use App\Services\ModuleCatalogSyncService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsModulesController extends Controller
{
    public function index(): Response
    {
        app(ModuleCatalogSyncService::class)->ensureFilesystemModulesRegistered();

        $modules = Module::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Module $m) => [
                'id' => $m->id,
                'slug' => $m->slug,
                'name' => $m->name,
                'description' => $m->description,
                'is_active' => $m->is_active,
                'is_core' => $m->is_core,
                'folder' => is_array($m->metadata) ? ($m->metadata['folder'] ?? null) : null,
                'in_filesystem' => is_array($m->metadata)
                    && ($m->metadata['source'] ?? null) === 'filesystem'
                    && isset($m->metadata['folder']),
            ])
            ->values()
            ->all();

        $accounts = Member::query()
            ->owners()
            ->with(['user', 'modules'])
            ->orderBy('company_name')
            ->orderBy('id')
            ->get()
            ->map(fn (Member $m) => [
                'id' => $m->id,
                'label' => $m->company_name ?: trim(implode(' ', array_filter([$m->first_name, $m->last_name]))) ?: ($m->user?->name ?? 'Member #'.$m->id),
                'email' => $m->user?->email,
                'module_ids' => $m->modules->pluck('id')->values()->all(),
            ])
            ->values()
            ->all();

        return Inertia::render('modules/Index', [
            'modules' => $modules,
            'accounts' => $accounts,
            'lang' => $this->lang(),
        ]);
    }

    public function updateMember(Request $request, Member $member): RedirectResponse
    {
        if (! $member->isOwner()) {
            abort(403);
        }

        $validated = $request->validate([
            'module_ids' => ['nullable', 'array'],
            'module_ids.*' => ['integer', 'exists:modules,id'],
        ]);

        $assignableIds = Module::query()->where('is_active', true)->pluck('id');
        $ids = collect($validated['module_ids'] ?? [])
            ->unique()
            ->values()
            ->intersect($assignableIds);

        $coreIds = Module::query()->where('is_active', true)->where('is_core', true)->pluck('id');
        $ids = $ids->merge($coreIds)->unique()->values();

        $syncData = [];
        foreach ($ids as $moduleId) {
            $syncData[$moduleId] = [
                'status' => 'active',
                'starts_at' => now(),
                'ends_at' => null,
            ];
        }

        $member->modules()->sync($syncData);

        return redirect()->back()->with('success', 'Moduli aggiornati per l’organizzazione selezionata.');
    }

    /**
     * @return array<string, string>
     */
    private function lang(): array
    {
        return [
            'breadcrumb_dashboard' => 'Dashboard',
            'breadcrumb_modules' => 'Moduli',
            'title' => 'Moduli e account',
            'description' => 'Catalogo moduli attivi e assegnazione all’organizzazione (member owner).',
            'catalog_title' => 'Catalogo moduli',
            'catalog_folder' => 'Cartella (app/Modules)',
            'catalog_origin' => 'Origine',
            'catalog_source_filesystem' => 'Su disco',
            'catalog_source_database' => 'Solo catalogo DB',
            'catalog_help' => 'Il catalogo include tutti i moduli rilevati in app/Modules (cartelle). Solo quelli attivi possono essere assegnati agli account.',
            'assign_title' => 'Assegnazione all’account',
            'assign_help' => 'Seleziona l’organizzazione (member owner). I moduli abilitano le aree app per tutti gli utenti di quell’account '
                .'(inclusi i record CRM Clienti e gli utenti con ruolo customer).',
            'account_label' => 'Organizzazione (account)',
            'account_placeholder' => 'Scegli un account…',
            'modules_for_account' => 'Moduli per questo account',
            'core_locked' => 'Modulo core (sempre attivo)',
            'inactive_module' => 'Non attivo nel catalogo',
            'save' => 'Salva assegnazione',
            'no_accounts' => 'Nessun member owner trovato. Crea prima un account con utente owner.',
            'select_account' => 'Seleziona un account per modificare i moduli.',
        ];
    }
}
