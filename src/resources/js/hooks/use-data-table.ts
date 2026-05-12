import { router, usePage } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

type SortOrder = 'asc' | 'desc';

type UseDataTableOptions = {
    initialPerPage: number;
    initialSortField: string;
    initialSortOrder: SortOrder;
    defaultVisibleColumns: Record<string, boolean>;
    storageKey: string;
    routeName?: string;
    /** Copia chiavi dall'oggetto `filters` Inertia verso la query ad ogni visita (es. log_filter). */
    mergePropsFilters?: string[];
};

function readColumns(storageKey: string, defaults: Record<string, boolean>): Record<string, boolean> {
    if (typeof window === 'undefined') {
        return defaults;
    }
    try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) {
            return defaults;
        }
        const parsed = JSON.parse(raw) as Record<string, boolean>;

        return { ...defaults, ...parsed };
    } catch {
        return defaults;
    }
}

function writeColumns(storageKey: string, cols: Record<string, boolean>): void {
    if (typeof window === 'undefined') {
        return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(cols));
}

export function useDataTable(options: UseDataTableOptions): {
    state: {
        search: string;
        sortField: string;
        sortOrder: SortOrder;
        perPage: number;
        visibleColumns: Record<string, boolean>;
    };
    handlers: {
        handleSearch: (value: string) => void;
        handlePageChange: (page: number) => void;
        handlePerPageChange: (perPage: number) => void;
        handleColumnToggle: (key: string, visible: boolean) => void;
        handleSort: (field: string, order: SortOrder) => void;
    };
} {
    const page = usePage();
    const routeName = options.routeName ?? 'users.index';

    const q = useMemo(() => {
        const idx = page.url.indexOf('?');
        if (idx === -1) {
            return new URLSearchParams();
        }

        return new URLSearchParams(page.url.slice(idx + 1));
    }, [page.url]);

    const inertiaFilters = useMemo(
        () => (page.props as { filters?: Record<string, unknown> }).filters ?? {},
        [page.url],
    );

    const filters = inertiaFilters as Record<string, string | undefined>;

    const [search, setSearch] = useState(() => q.get('search') ?? filters.search ?? '');
    const [sortField, setSortField] = useState(() => q.get('sort_field') ?? filters.sort_field ?? options.initialSortField);
    const [sortOrder, setSortOrder] = useState<SortOrder>(
        () => (q.get('sort_order') as SortOrder) ?? (filters.sort_order as SortOrder) ?? options.initialSortOrder,
    );
    const [perPage, setPerPage] = useState(() => Number(q.get('per_page')) || options.initialPerPage);
    const [visibleColumns, setVisibleColumns] = useState(() =>
        readColumns(options.storageKey, options.defaultVisibleColumns),
    );

    const visit = useCallback(
        (overrides: Record<string, string | number | undefined>) => {
            const mergedFromProps = options.mergePropsFilters ?? [];
            const params: Record<string, string | number> = {};

            for (const key of mergedFromProps) {
                if (!Object.prototype.hasOwnProperty.call(inertiaFilters, key)) {
                    continue;
                }
                const v = inertiaFilters[key];
                if (v !== undefined && v !== null && v !== '') {
                    params[key] = typeof v === 'number' ? v : String(v);
                }
            }

            params.search = overrides.search ?? search;
            params.sort_field = overrides.sort_field ?? sortField;
            params.sort_order = overrides.sort_order ?? sortOrder;
            params.per_page = overrides.per_page ?? perPage;
            params.page = overrides.page ?? 1;

            const cleaned = Object.fromEntries(
                Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
            ) as Record<string, string | number>;

            router.get(route(routeName as never), cleaned, { preserveState: true, preserveScroll: true, replace: true });
        },
        [inertiaFilters, options.mergePropsFilters, perPage, routeName, search, sortField, sortOrder],
    );

    const handleSearch = useCallback(
        (value: string) => {
            setSearch(value);
            visit({ search: value, page: 1 });
        },
        [visit],
    );

    const handlePageChange = useCallback(
        (p: number) => {
            visit({ page: p });
        },
        [visit],
    );

    const handlePerPageChange = useCallback(
        (pp: number) => {
            setPerPage(pp);
            visit({ per_page: pp, page: 1 });
        },
        [visit],
    );

    const handleColumnToggle = useCallback(
        (key: string, visible: boolean) => {
            setVisibleColumns((prev) => {
                const next = { ...prev, [key]: visible };
                writeColumns(options.storageKey, next);

                return next;
            });
        },
        [options.storageKey],
    );

    const handleSort = useCallback(
        (field: string, order: SortOrder) => {
            setSortField(field);
            setSortOrder(order);
            visit({ sort_field: field, sort_order: order, page: 1 });
        },
        [visit],
    );

    return {
        state: { search, sortField, sortOrder, perPage, visibleColumns },
        handlers: {
            handleSearch,
            handlePageChange,
            handlePerPageChange,
            handleColumnToggle,
            handleSort,
        },
    };
}
