<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PermissionDescription;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;

class SettingsPermissionsController extends Controller
{
    public function index(): Response
    {
        $permissions = Permission::query()->orderBy('name')->get();

        $descriptionsByPermissionId = PermissionDescription::query()
            ->whereIn('permission_id', $permissions->pluck('id'))
            ->get()
            ->groupBy('permission_id');

        $resolveDescription = function (int $permissionId) use ($descriptionsByPermissionId): string {
            /** @var Collection<int, PermissionDescription> $rows */
            $rows = $descriptionsByPermissionId->get($permissionId, collect());
            if ($rows->isEmpty()) {
                return '';
            }

            $locale = app()->getLocale();
            $fallback = config('app.fallback_locale', 'en');

            return (string) (
                $rows->firstWhere('locale', $locale)?->description
                ?? $rows->firstWhere('locale', $fallback)?->description
                ?? $rows->firstWhere('locale', 'it')?->description
                ?? $rows->first()?->description
                ?? ''
            );
        };

        $grouped = $permissions
            ->groupBy(fn (Permission $p) => explode('.', $p->name)[0] ?? 'Other')
            ->map(fn ($group) => $group->map(function (Permission $p) use ($resolveDescription): array {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'guard_name' => $p->guard_name,
                    'category' => explode('.', $p->name)[0] ?? 'Other',
                    'description' => $resolveDescription((int) $p->id),
                ];
            })->values()->all())
            ->all();

        return Inertia::render('Permissions/Index', [
            'permissionsGrouped' => $grouped,
        ]);
    }
}
