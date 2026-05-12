<?php

namespace App\Modules\Web\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\WebHostingProvider;
use App\Modules\Web\Http\Requests\StoreWebHostingProviderRequest;
use App\Modules\Web\Http\Requests\UpdateWebHostingProviderRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WebHostingProviderController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', WebHostingProvider::class);

        $allowedPerPage = [10, 15, 20, 25, 50, 100];
        $perPage = $this->inertiaTablePerPage($request, $allowedPerPage, 20);

        [$sf, $sd] = $this->inertiaTableSort($request, ['name', 'slug', 'servers_count', 'id', 'created_at', 'updated_at'], 'name');

        $query = WebHostingProvider::query()->withCount('servers');

        $query->orderBy($sf, $sd)->orderBy('id');

        $paginator = $query->paginate($perPage);
        $paginator->withQueryString();
        $paginator->setCollection(
            $paginator->getCollection()->map(fn (WebHostingProvider $p): array => [
                'id' => $p->id,
                'slug' => $p->slug,
                'name' => $p->name,
                'website_url' => $p->website_url,
                'servers_count' => $p->servers_count,
                'created_at' => $p->created_at?->toIso8601String(),
                'updated_at' => $p->updated_at?->toIso8601String(),
            ]),
        );

        return Inertia::render('modules/web/hosting-providers/index', [
            'providers' => [
                'data' => $paginator->items(),
                'pagination' => $this->inertiaTablePaginationMeta($paginator),
            ],
            'filters' => [
                'sort_field' => $sf,
                'sort_order' => $sd,
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', WebHostingProvider::class);

        return Inertia::render('modules/web/hosting-providers/create');
    }

    public function store(StoreWebHostingProviderRequest $request): RedirectResponse
    {
        WebHostingProvider::query()->create($request->validated());

        return redirect()
            ->route('modules.web.hosting-providers.index')
            ->with('success', __('Fornitore hosting creato.'));
    }

    public function show(WebHostingProvider $web_hosting_provider): Response
    {
        $this->authorize('view', $web_hosting_provider);

        $web_hosting_provider->loadCount('servers');

        return Inertia::render('modules/web/hosting-providers/show', [
            'provider' => [
                'id' => $web_hosting_provider->id,
                'slug' => $web_hosting_provider->slug,
                'name' => $web_hosting_provider->name,
                'website_url' => $web_hosting_provider->website_url,
                'servers_count' => $web_hosting_provider->servers_count,
            ],
        ]);
    }

    public function edit(WebHostingProvider $web_hosting_provider): Response
    {
        $this->authorize('update', $web_hosting_provider);

        return Inertia::render('modules/web/hosting-providers/edit', [
            'provider' => [
                'id' => $web_hosting_provider->id,
                'slug' => $web_hosting_provider->slug,
                'name' => $web_hosting_provider->name,
                'website_url' => $web_hosting_provider->website_url,
            ],
        ]);
    }

    public function update(UpdateWebHostingProviderRequest $request, WebHostingProvider $web_hosting_provider): RedirectResponse
    {
        $web_hosting_provider->fill($request->validated());
        $web_hosting_provider->save();

        return redirect()
            ->route('modules.web.hosting-providers.index')
            ->with('success', __('Fornitore hosting aggiornato.'));
    }

    public function destroy(WebHostingProvider $web_hosting_provider): RedirectResponse
    {
        $this->authorize('delete', $web_hosting_provider);

        if ($web_hosting_provider->servers()->exists()) {
            return redirect()
                ->back()
                ->with('error', __('Impossibile eliminare: ci sono ancora server collegati a questo fornitore.'));
        }

        $web_hosting_provider->delete();

        return redirect()
            ->route('modules.web.hosting-providers.index')
            ->with('success', __('Fornitore hosting eliminato.'));
    }
}
