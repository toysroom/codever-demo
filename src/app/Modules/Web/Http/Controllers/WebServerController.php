<?php

namespace App\Modules\Web\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\WebHostingProvider;
use App\Models\WebServer;
use App\Modules\Web\Http\Requests\StoreWebServerRequest;
use App\Modules\Web\Http\Requests\UpdateWebServerRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WebServerController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', WebServer::class);

        $allowedPerPage = [10, 15, 20, 25, 50, 100];
        $perPage = $this->inertiaTablePerPage($request, $allowedPerPage, 20);

        [$sf, $sd] = $this->inertiaTableSort($request, [
            'host',
            'label',
            'member_id',
            'web_hosting_provider_id',
            'id',
            'created_at',
            'updated_at',
        ], 'id');

        $query = WebServer::query()->with([
            'hostingProvider:id,name,slug',
            'member:id,company_name,first_name,last_name',
        ]);

        $query->orderBy($sf, $sd)->orderByDesc('id');

        $paginator = $query->paginate($perPage);
        $paginator->withQueryString();
        $paginator->setCollection(
            $paginator->getCollection()->map(
                fn (WebServer $s): array => [
                    'id' => $s->id,
                    'label' => $s->label,
                    'host' => $s->host,
                    'member' => $s->member
                        ? [
                            'id' => $s->member->id,
                            'company_name' => $s->member->company_name,
                        ]
                        : null,
                    'provider_name' => $s->hostingProvider?->name ?? '',
                    'provider_slug' => $s->hostingProvider?->slug ?? '',
                    'web_hosting_provider_id' => $s->web_hosting_provider_id,
                    'created_at' => $s->created_at?->toIso8601String(),
                    'updated_at' => $s->updated_at?->toIso8601String(),
                ],
            ),
        );

        return Inertia::render('modules/web/servers/index', [
            'servers' => [
                'data' => $paginator->items(),
                'pagination' => $this->inertiaTablePaginationMeta($paginator),
            ],
            'filters' => [
                'sort_field' => $sf,
                'sort_order' => $sd,
            ],
        ]);
    }

    public function create(): Response|RedirectResponse
    {
        $this->authorize('create', WebServer::class);

        if (WebHostingProvider::query()->doesntExist()) {
            return redirect()
                ->route('modules.web.hosting-providers.index')
                ->with('warning', __('Aggiungi almeno un fornitore hosting prima di registrare un server.'));
        }

        [, $memberOwners] = $this->memberOwnersAndIds();

        return Inertia::render('modules/web/servers/create', [
            'memberOwners' => $memberOwners,
            'hostingProviders' => WebHostingProvider::query()
                ->orderBy('name')
                ->get(['id', 'name', 'slug'])
                ->values()
                ->all(),
        ]);
    }

    public function store(StoreWebServerRequest $request): RedirectResponse
    {
        WebServer::query()->create($request->validated());

        return redirect()
            ->route('modules.web.servers.index')
            ->with('success', __('Server registrato.'));
    }

    public function show(WebServer $web_server): Response
    {
        $this->authorize('view', $web_server);

        $web_server->load([
            'hostingProvider:id,name,slug',
            'member:id,company_name,first_name,last_name',
        ]);

        $m = $web_server->member;

        return Inertia::render('modules/web/servers/show', [
            'server' => [
                'id' => $web_server->id,
                'label' => $web_server->label,
                'host' => $web_server->host,
                'notes' => $web_server->notes,
                'member_label' => $m
                    ? (string) ($m->company_name ?: trim(($m->first_name ?? '').' '.($m->last_name ?? '')) ?: ('#'.$m->id))
                    : '',
                'provider_name' => $web_server->hostingProvider?->name ?? '',
                'provider_slug' => $web_server->hostingProvider?->slug ?? '',
            ],
        ]);
    }

    public function edit(WebServer $web_server): Response
    {
        $this->authorize('update', $web_server);

        [, $memberOwners] = $this->memberOwnersAndIds();

        return Inertia::render('modules/web/servers/edit', [
            'server' => [
                'id' => $web_server->id,
                'member_id' => $web_server->member_id,
                'web_hosting_provider_id' => $web_server->web_hosting_provider_id,
                'label' => $web_server->label,
                'host' => $web_server->host,
                'notes' => $web_server->notes,
            ],
            'memberOwners' => $memberOwners,
            'hostingProviders' => WebHostingProvider::query()
                ->orderBy('name')
                ->get(['id', 'name', 'slug'])
                ->values()
                ->all(),
        ]);
    }

    public function update(UpdateWebServerRequest $request, WebServer $web_server): RedirectResponse
    {
        $web_server->fill($request->validated());
        $web_server->save();

        return redirect()
            ->route('modules.web.servers.index')
            ->with('success', __('Server aggiornato.'));
    }

    public function destroy(WebServer $web_server): RedirectResponse
    {
        $this->authorize('delete', $web_server);

        $web_server->delete();

        return redirect()
            ->route('modules.web.servers.index')
            ->with('success', __('Server eliminato.'));
    }

    /**
     * @return array{0: array<int,int>, 1: list<array{id:int, label:string}>}
     */
    protected function memberOwnersAndIds(): array
    {
        $memberOwners = Member::query()
            ->when(! request()->user()?->isAdmin(), fn ($q) => $q->whereKey(request()->user()?->getOwnerMember()?->id))
            ->owners()
            ->orderBy('company_name')
            ->orderBy('id')
            ->get(['id', 'company_name', 'first_name', 'last_name'])
            ->map(fn (Member $m): array => [
                'id' => $m->id,
                'label' => $m->company_name ?: trim(($m->first_name ?? '').' '.($m->last_name ?? '')) ?: ('#'.$m->id),
            ])
            ->all();

        return [
            array_map(static fn (array $o): int => $o['id'], $memberOwners),
            $memberOwners,
        ];
    }
}
