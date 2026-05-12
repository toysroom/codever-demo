<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

trait InteractsWithInertiaTableSorting
{
    /**
     * Righe per pagina (whitelist).
     *
     * @param  list<int>  $allowed
     */
    protected function inertiaTablePerPage(Request $request, array $allowed, int $default): int
    {
        $n = (int) $request->query('per_page', $default);

        return in_array($n, $allowed, true) ? $n : $default;
    }

    /**
     * Ordinamento con whitelist sicura sulle colonne DB.
     *
     * @param  list<string>  $whitelist
     * @return array{0: string, 1: 'asc'|'desc'}
     */
    protected function inertiaTableSort(Request $request, array $whitelist, string $defaultField, string $defaultOrder = 'asc'): array
    {
        $field = $request->query('sort_field', $defaultField);
        if (! is_string($field) || ! in_array($field, $whitelist, true)) {
            $field = $defaultField;
        }
        $order = strtolower((string) $request->query('sort_order', $defaultOrder)) === 'desc' ? 'desc' : 'asc';

        return [$field, $order];
    }

    /**
     * @return array<string, int|null>
     */
    protected function inertiaTablePaginationMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];
    }
}
