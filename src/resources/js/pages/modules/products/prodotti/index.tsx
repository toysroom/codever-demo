import {
    CreatedAtContent,
    DataTable,
    IndexTableRowActions,
    PageHeaderActions,
    UpdatedAtContent,
    type DataTablePagination,
} from '@/components/custom';
import { ProductsModuleDataLayerBanner } from '@/components/domains/products/products-module-data-layer-banner';
import { ProductChangeHistoryDialog } from '@/components/domains/products/product-change-history-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDataTable, useFlashMessages } from '@/hooks';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, DataTableColumn, SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { type FormEventHandler, type ReactNode, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

function ProductsSearchForm({
    appliedSearch,
    onApply,
}: {
    appliedSearch: string;
    onApply: (trimmed: string) => void;
}) {
    const [draftSearch, setDraftSearch] = useState(appliedSearch);

    const submitSearch: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        onApply(draftSearch.trim());
    };

    return (
        <form className="w-full sm:max-w-lg" onSubmit={submitSearch}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <div className="relative min-w-0 grow">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                        type="search"
                        value={draftSearch}
                        onChange={(e) => setDraftSearch(e.target.value)}
                        placeholder="Codice o nome prodotto…"
                        className="pl-9"
                        name="search"
                        autoComplete="off"
                    />
                </div>
                <Button type="submit" className="shrink-0 sm:w-auto">
                    Cerca
                </Button>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
                La ricerca è sul server (codice e nome). Dopo aver premuto Cerca, le corrispondenze sono evidenziate in giallo in tabella.
            </p>
        </form>
    );
}

function highlightProductField(text: string, needle: string): ReactNode {
    const q = needle.trim();
    if (!q) {
        return text;
    }
    const lower = text.toLowerCase();
    const qLower = q.toLowerCase();
    const segments: ReactNode[] = [];
    let pos = 0;
    let key = 0;
    while (pos < text.length) {
        const found = lower.indexOf(qLower, pos);
        if (found === -1) {
            segments.push(text.slice(pos));
            break;
        }
        if (found > pos) {
            segments.push(text.slice(pos, found));
        }
        const matchEnd = found + q.length;
        segments.push(
            <mark
                key={`hl-${key}`}
                className="rounded-sm bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-900/55"
            >
                {text.slice(found, matchEnd)}
            </mark>,
        );
        key += 1;
        pos = matchEnd;
    }
    return segments.length > 0 ? <>{segments}</> : text;
}

interface MemberSummary {
    id: number;
    company_name: string | null;
}

interface PriceRow {
    price_list_id: number;
    list_name?: string;
    currency?: string;
    amount: string;
}

interface ProductRow {
    id: number;
    code: string;
    name: string;
    is_active?: boolean;
    has_change_history?: boolean;
    category?: { id: number; name: string } | null;
    member?: MemberSummary | null;
    prices: PriceRow[];
    created_at?: string | null;
    updated_at?: string | null;
}

interface Props {
    products: {
        data: ProductRow[];
        pagination: DataTablePagination;
    };
    filters: {
        sort_field: string;
        sort_order: string;
        search: string;
    };
    productsModuleDataLayer?: 'redis' | 'database' | null;
}

function priceSummary(prices: PriceRow[]): string {
    if (!prices.length) {
        return '—';
    }
    return prices.map((p) => `${p.list_name ?? '#'}: ${p.amount} ${p.currency ?? ''}`).join('; ');
}

export default function ProductsIndex({ products, filters, productsModuleDataLayer }: Props) {
    const page = usePage<SharedData>();
    const isAdmin = page.props.auth?.user?.user_type === 'admin';
    useFlashMessages();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Prodotti', href: route('modules.products.prodotti.index') },
    ];

    const { state, handlers } = useDataTable({
        initialPerPage: products.pagination.per_page ?? 15,
        initialSortField: filters.sort_field ?? 'sort_order',
        initialSortOrder: (filters.sort_order as 'asc' | 'desc') ?? 'asc',
        defaultVisibleColumns: {
            member_account: true,
            code: true,
            name: true,
            category: true,
            prices: true,
            is_active: true,
            created_at: false,
            updated_at: true,
            actions: true,
        },
        storageKey: 'modules_products_products_table',
        routeName: 'modules.products.prodotti.index',
    });

    const destroyRow = (id: number) => {
        router.delete(route('modules.products.prodotti.destroy', id), { preserveScroll: true });
    };

    const toggleRow = (id: number) => {
        router.post(route('modules.products.prodotti.toggle-active', id), {}, { preserveScroll: true });
    };

    const columns = useMemo((): DataTableColumn<ProductRow>[] => {
        const vis = state.visibleColumns;
        const cols: DataTableColumn<ProductRow>[] = [];

        if (isAdmin) {
            cols.push({
                key: 'member_account',
                label: 'Account',
                visible: vis.member_account !== false,
                sortable: false,
                render: (_, row) =>
                    String(row.member?.company_name ?? (row.member?.id != null ? `#${row.member?.id}` : '—')),
            });
        }

        cols.push(
            {
                key: 'code',
                label: 'Codice',
                visible: vis.code !== false,
                sortable: true,
                cellClassName: 'font-mono text-xs',
                render: (_, row) => highlightProductField(row.code, state.search),
            },
            {
                key: 'name',
                label: 'Nome',
                visible: vis.name !== false,
                sortable: true,
                render: (_, row) => highlightProductField(row.name, state.search),
            },
            {
                key: 'category',
                label: 'Categoria',
                visible: vis.category !== false,
                sortable: false,
                headerClassName: 'text-muted-foreground',
                cellClassName: 'text-muted-foreground',
                render: (_, row) => row.category?.name ?? '—',
            },
            {
                key: 'prices',
                label: 'Prezzi',
                visible: vis.prices !== false,
                sortable: false,
                headerClassName: 'text-muted-foreground',
                cellClassName: 'text-muted-foreground max-w-[240px] truncate text-xs',
                render: (_, row) => priceSummary(row.prices),
            },
            {
                key: 'is_active',
                label: 'Attivo',
                visible: vis.is_active !== false,
                sortable: true,
                render: (_, row) => (
                    <span
                        className={
                            row.is_active !== false
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-muted-foreground'
                        }
                    >
                        {row.is_active !== false ? 'Attivo' : 'Disattivo'}
                    </span>
                ),
            },
            {
                key: 'created_at',
                label: 'Creato',
                visible: vis.created_at !== false,
                sortable: true,
                headerClassName: 'text-muted-foreground whitespace-nowrap',
                cellClassName: 'text-muted-foreground text-xs whitespace-nowrap',
                render: (_, row) => <CreatedAtContent date={row.created_at ?? ''} />,
            },
            {
                key: 'updated_at',
                label: 'Aggiornato',
                visible: vis.updated_at !== false,
                sortable: true,
                headerClassName: 'text-muted-foreground whitespace-nowrap',
                cellClassName: 'text-muted-foreground text-xs whitespace-nowrap',
                render: (_, row) => <UpdatedAtContent date={row.updated_at ?? ''} />,
            },
            {
                key: 'actions',
                label: 'Azioni',
                visible: vis.actions !== false,
                headerAlign: 'right',
                headerClassName: 'text-right',
                cellAlign: 'right',
                sortable: false,
                render: (_, row) => (
                    <IndexTableRowActions
                        leading={
                            row.has_change_history ? (
                                <ProductChangeHistoryDialog
                                    fetchUrl={route('modules.products.prodotti.change-history', row.id)}
                                />
                            ) : null
                        }
                        toggleActive={{
                            isActive: row.is_active !== false,
                            onClick: () => toggleRow(row.id),
                        }}
                        showHref={route('modules.products.prodotti.show', row.id)}
                        editHref={route('modules.products.prodotti.edit', row.id)}
                        onDelete={() => destroyRow(row.id)}
                        deleteEntityLabel={row.code ? `${row.name} (${row.code})` : row.name}
                    />
                ),
            },
        );

        return cols;
    }, [isAdmin, state.visibleColumns, state.search]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Prodotti" />
            <div className="flex flex-col gap-4 p-4">
                <ProductsModuleDataLayerBanner layer={productsModuleDataLayer} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-xl font-semibold tracking-tight">Catalogo prodotti</h1>
                    <Button asChild>
                        <Link href={route('modules.products.prodotti.create')}>
                            <Plus className="mr-2 size-4" />
                            Nuovo prodotto
                        </Link>
                    </Button>
                </div>
                <PageHeaderActions>
                    <ProductsSearchForm
                        key={`applied:${filters.search}`}
                        appliedSearch={filters.search ?? ''}
                        onApply={(trimmed) => {
                            handlers.handleSearch(trimmed);
                        }}
                    />
                </PageHeaderActions>
                <DataTable
                    data={products.data}
                    columns={columns}
                    pagination={products.pagination}
                    emptyMessage="Nessun prodotto. Importa dal listino Excel o creane uno nuovo."
                    columnToggleButtonLabel="Personalizza colonne"
                    currentPerPage={state.perPage}
                    onPageChange={handlers.handlePageChange}
                    onPerPageChange={handlers.handlePerPageChange}
                    onColumnToggle={handlers.handleColumnToggle}
                    onSort={handlers.handleSort}
                    sortField={state.sortField}
                    sortOrder={state.sortOrder}
                />
            </div>
        </AppLayout>
    );
}
