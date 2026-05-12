import {
    CreatedAtContent,
    DeleteButton,
    EditButton,
    UpdatedAtContent,
    ViewButton,
    DataTable,
    type DataTablePagination,
} from '@/components/custom';
import { Button } from '@/components/ui/button';
import { useDataTable, useFlashMessages } from '@/hooks';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, DataTableColumn } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { route } from 'ziggy-js';

interface ProviderRow {
    id: number;
    slug: string;
    name: string;
    website_url: string | null;
    servers_count: number;
    created_at?: string | null;
    updated_at?: string | null;
}

interface Props {
    providers: {
        data: ProviderRow[];
        pagination: DataTablePagination;
    };
    filters: {
        sort_field: string;
        sort_order: string;
    };
}

export default function HostingProvidersIndex({ providers, filters }: Props) {
    useFlashMessages();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Fornitori hosting', href: route('modules.web.hosting-providers.index') },
    ];

    const { state, handlers } = useDataTable({
        initialPerPage: providers.pagination.per_page ?? 20,
        initialSortField: filters.sort_field ?? 'name',
        initialSortOrder: (filters.sort_order as 'asc' | 'desc') ?? 'asc',
        defaultVisibleColumns: {
            slug: true,
            name: true,
            website: true,
            servers_count: true,
            created_at: false,
            updated_at: true,
            actions: true,
        },
        storageKey: 'modules_web_hosting_providers_table',
        routeName: 'modules.web.hosting-providers.index',
    });

    const destroyRow = (id: number) => {
        if (!confirm('Eliminare questo fornitore? (Bloccato se ancora usato da server.)')) {
            return;
        }
        router.delete(route('modules.web.hosting-providers.destroy', id), { preserveScroll: true });
    };

    const columns = useMemo((): DataTableColumn<ProviderRow>[] => {
        const vis = state.visibleColumns;

        return [
            {
                key: 'slug',
                label: 'Slug',
                visible: vis.slug !== false,
                sortable: true,
                cellClassName: 'font-mono text-xs',
                render: (_, r) => r.slug,
            },
            {
                key: 'name',
                label: 'Nome',
                visible: vis.name !== false,
                sortable: true,
                render: (_, r) => r.name,
            },
            {
                key: 'website_url',
                label: 'Sito',
                visible: vis.website !== false,
                sortable: false,
                headerClassName: 'text-muted-foreground',
                cellClassName: 'text-muted-foreground max-w-[220px] truncate text-xs',
                render: (_, r) =>
                    r.website_url ? (
                        <a href={r.website_url} className="underline" target="_blank" rel="noreferrer">
                            {r.website_url}
                        </a>
                    ) : (
                        '—'
                    ),
            },
            {
                key: 'servers_count',
                label: 'Server',
                visible: vis.servers_count !== false,
                sortable: true,
                render: (_, r) => r.servers_count,
            },
            {
                key: 'created_at',
                label: 'Creato',
                visible: vis.created_at !== false,
                sortable: true,
                headerClassName: 'text-muted-foreground whitespace-nowrap',
                cellClassName: 'text-muted-foreground text-xs whitespace-nowrap',
                render: (_, r) => <CreatedAtContent date={r.created_at ?? ''} />,
            },
            {
                key: 'updated_at',
                label: 'Aggiornato',
                visible: vis.updated_at !== false,
                sortable: true,
                headerClassName: 'text-muted-foreground whitespace-nowrap',
                cellClassName: 'text-muted-foreground text-xs whitespace-nowrap',
                render: (_, r) => <UpdatedAtContent date={r.updated_at ?? ''} />,
            },
            {
                key: 'actions',
                label: 'Azioni',
                visible: vis.actions !== false,
                headerAlign: 'right',
                headerClassName: 'text-right',
                cellAlign: 'right',
                sortable: false,
                render: (_, r) => (
                    <div className="flex justify-end gap-2">
                        <ViewButton href={route('modules.web.hosting-providers.show', r.id)} />
                        <EditButton href={route('modules.web.hosting-providers.edit', r.id)} />
                        <DeleteButton onClick={() => destroyRow(r.id)} />
                    </div>
                ),
            },
        ];
    }, [state.visibleColumns]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Fornitori hosting" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-xl font-semibold tracking-tight">Fornitori hosting</h1>
                    <Button asChild>
                        <Link href={route('modules.web.hosting-providers.create')}>
                            <Plus className="mr-2 size-4" />
                            Nuovo fornitore
                        </Link>
                    </Button>
                </div>
                <p className="text-muted-foreground text-sm">
                    Catalogo condiviso della piattaforma — aggiornabile da CRUD. Il JSON di seed può essere ampliato in
                    <code className="bg-muted px-1">database/seeders/data/hosting_provider_names.json</code>.
                </p>
                <DataTable
                    data={providers.data}
                    columns={columns}
                    pagination={providers.pagination}
                    emptyMessage="Nessun fornitore configurato."
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
