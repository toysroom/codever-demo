<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLicensePlanPerpetualCodeRequest;
use App\Http\Requests\Admin\StoreLicensePlanRequest;
use App\Http\Requests\Admin\UpdateLicensePlanRequest;
use App\Models\LicensePlan;
use App\Models\LicensePlanPerpetualCode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class SettingsLicensePlansController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $allowedPerPage = [10, 15, 20, 25, 50, 100];
        $perPage = $this->inertiaTablePerPage($request, $allowedPerPage, 25);

        [$sf, $sd] = $this->inertiaTableSort($request, [
            'sort_order',
            'name',
            'slug',
            'package_tier',
            'price',
            'billing_period',
            'annual_term_months',
            'trial_days',
            'max_customers',
            'max_sub_members',
            'is_active',
            'id',
            'created_at',
            'updated_at',
        ], 'sort_order');

        $paginator = LicensePlan::query()
            ->orderBy($sf, $sd)
            ->orderBy('id')
            ->paginate($perPage)
            ->withQueryString();

        $paginator->setCollection(
            $paginator->getCollection()->map(static fn (LicensePlan $p): array => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'package_tier' => $p->package_tier,
                'description' => $p->description,
                'price' => $p->price !== null ? (string) $p->price : null,
                'billing_period' => $p->billing_period,
                'annual_term_months' => $p->annual_term_months,
                'trial_days' => $p->trial_days,
                'max_customers' => $p->max_customers,
                'max_sub_members' => $p->max_sub_members,
                'is_active' => (bool) $p->is_active,
                'sort_order' => $p->sort_order,
                'created_at' => $p->created_at?->toIso8601String(),
                'updated_at' => $p->updated_at?->toIso8601String(),
            ]),
        );

        return Inertia::render('LicensePlans/Index', [
            'plans' => [
                'data' => $paginator->items(),
                'pagination' => $this->inertiaTablePaginationMeta($paginator),
            ],
            'filters' => [
                'sort_field' => $sf,
                'sort_order' => $sd,
            ],
        ]);
    }

    public function create(): InertiaResponse
    {
        return Inertia::render('LicensePlans/Create', []);
    }

    public function store(StoreLicensePlanRequest $request): RedirectResponse
    {
        $validated = Arr::except($request->validated(), ['redirect_to_index']);

        $slug = $validated['slug'] ?? Str::slug($validated['name']);
        if ($slug === '') {
            $slug = Str::slug($validated['name'].'-plan');
        }

        $originalSlug = $slug;
        $i = 2;
        while (LicensePlan::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $originalSlug.'-'.$i;
            $i++;
        }

        $plan = LicensePlan::query()->create([
            'name' => $validated['name'],
            'slug' => $slug,
            'package_tier' => $validated['package_tier'] ?? null,
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'] ?? null,
            'billing_period' => $validated['billing_period'] ?? null,
            'annual_term_months' => $validated['annual_term_months'],
            'trial_days' => $validated['trial_days'],
            'max_customers' => $validated['max_customers'] ?? null,
            'max_sub_members' => $validated['max_sub_members'] ?? null,
            'features' => $this->decodeFeatures($validated['features_json'] ?? null),
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => $validated['sort_order'],
        ]);

        if ($request->boolean('redirect_to_index')) {
            return redirect()->route('license-plans.index')->with('success', __('Piano licenza creato.'));
        }

        return redirect()->route('license-plans.show', $plan)->with('success', __('Piano licenza creato.'));
    }

    public function show(LicensePlan $license_plan): InertiaResponse
    {
        $license_plan->loadCount('members');
        $license_plan->load(['perpetualCodes' => fn ($q) => $q->orderByDesc('id')]);

        return Inertia::render('LicensePlans/Show', [
            'plan' => array_merge($this->planPayload($license_plan), [
                'members_count' => $license_plan->members_count,
                'perpetual_codes' => $license_plan->perpetualCodes->map(fn (LicensePlanPerpetualCode $c) => [
                    'id' => $c->id,
                    'code' => $c->code,
                    'notes' => $c->notes,
                    'is_active' => $c->is_active,
                    'created_at' => $c->created_at?->toIso8601String(),
                ])->values()->all(),
            ]),
        ]);
    }

    public function edit(LicensePlan $license_plan): InertiaResponse
    {
        return Inertia::render('LicensePlans/Edit', [
            'plan' => $this->planPayload($license_plan),
        ]);
    }

    public function update(UpdateLicensePlanRequest $request, LicensePlan $license_plan): RedirectResponse
    {
        $validated = Arr::except($request->validated(), ['redirect_to_index']);

        $license_plan->update([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'package_tier' => $validated['package_tier'] ?? null,
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'] ?? null,
            'billing_period' => $validated['billing_period'] ?? null,
            'annual_term_months' => $validated['annual_term_months'],
            'trial_days' => $validated['trial_days'],
            'max_customers' => $validated['max_customers'] ?? null,
            'max_sub_members' => $validated['max_sub_members'] ?? null,
            'features' => $this->decodeFeatures($validated['features_json'] ?? null),
            'is_active' => $request->boolean('is_active'),
            'sort_order' => $validated['sort_order'],
        ]);

        if ($request->boolean('redirect_to_index')) {
            return redirect()->route('license-plans.index')->with('success', __('Piano licenza aggiornato.'));
        }

        return redirect()->route('license-plans.show', $license_plan)->with('success', __('Piano licenza aggiornato.'));
    }

    public function destroy(LicensePlan $license_plan): RedirectResponse
    {
        if ($license_plan->members()->exists()) {
            return redirect()->route('license-plans.index')->with('error', __('Impossibile eliminare: il piano è assegnato a uno o più account.'));
        }

        $license_plan->delete();

        return redirect()->route('license-plans.index')->with('success', __('Piano licenza eliminato.'));
    }

    public function toggleActive(LicensePlan $license_plan): RedirectResponse
    {
        $license_plan->update(['is_active' => ! $license_plan->is_active]);

        return redirect()
            ->route('license-plans.index')
            ->with('success', __('Stato piano aggiornato.'));
    }

    public function storePerpetualCode(StoreLicensePlanPerpetualCodeRequest $request, LicensePlan $license_plan): RedirectResponse
    {
        LicensePlanPerpetualCode::query()->create([
            'license_plan_id' => $license_plan->id,
            'code' => $request->validated()['code'],
            'notes' => $request->validated()['notes'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->route('license-plans.show', $license_plan)
            ->with('success', __('Codice a durata illimitata creato.'));
    }

    public function destroyPerpetualCode(LicensePlan $license_plan, LicensePlanPerpetualCode $perpetual_code): RedirectResponse
    {
        if ($perpetual_code->license_plan_id !== $license_plan->id) {
            abort(404);
        }

        $perpetual_code->delete();

        return redirect()
            ->route('license-plans.show', $license_plan)
            ->with('success', __('Codice rimosso.'));
    }

    /**
     * @return array<string, mixed>
     */
    protected function planPayload(LicensePlan $license_plan): array
    {
        return [
            'id' => $license_plan->id,
            'name' => $license_plan->name,
            'slug' => $license_plan->slug,
            'package_tier' => $license_plan->package_tier,
            'description' => $license_plan->description,
            'price' => $license_plan->price,
            'billing_period' => $license_plan->billing_period,
            'annual_term_months' => $license_plan->annual_term_months,
            'trial_days' => $license_plan->trial_days,
            'max_customers' => $license_plan->max_customers,
            'max_sub_members' => $license_plan->max_sub_members,
            'features_json' => json_encode($license_plan->features ?? [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            'is_active' => $license_plan->is_active,
            'sort_order' => $license_plan->sort_order,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    protected function decodeFeatures(?string $json): ?array
    {
        if ($json === null || trim($json) === '') {
            return null;
        }

        $decoded = json_decode($json, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'features_json' => [__('JSON non valido.')],
            ]);
        }

        if (! is_array($decoded)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'features_json' => [__('features_json deve essere un array JSON.')],
            ]);
        }

        return $decoded;
    }
}
