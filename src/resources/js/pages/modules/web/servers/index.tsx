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
import type { BreadcrumbItem, DataTableColumn, SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { route } from 'ziggy-js';

interface ServerRow {
    id: number;
    label: string | null;
    host: string;
    member: { id: number; company_name: string | null } | null;
    provider_name: string;
    provider_slug: string;
    web_hosting_provider_id: number;
    created_at?: string | null;
    updated_at?: string | null;
}

interface Props {
    servers: {
        data: ServerRow[];
        pagination: DataTablePagination;
    };
    filters: {
        sort_field: string;
        sort_order: string;
    };
}

export default function ServersIndex({ servers, filters }: Props) {
    const pageCtx = usePage<SharedData>();
    const isAdmin = pageCtx.props.auth?.user?.user_type === 'admin';
    useFlashMessages();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Server', href: route('modules.web.servers.index') },
    ];

    const { state, handlers } = useDataTable({
        initialPerPage: servers.pagination.per_page ?? 20,
        initialSortField: filters.sort_field ?? 'id',
        initialSortOrder: (filters.sort_order as 'asc' | 'desc') ?? 'desc',
        defaultVisibleColumns: {
            member_account: true,
            host: true,
            label: true,
            provider: true,
            created_at: false,
            updated_at: true,
            actions: true,
        },
        storageKey: 'modules_web_servers_table',
        routeName: 'modules.web.servers.index',
    });

    const destroyRow = (id: number) => {
        if (!confirm('Eliminare questo server?')) {
            return;
        }
        router.delete(route('modules.web.servers.destroy', id), { preserveScroll: true });
    };

    const columns = useMemo((): DataTableColumn<ServerRow>[] => {
        const vis = state.visibleColumns;
        const cols: DataTableColumn<ServerRow>[] = [];

        if (isAdmin) {
            cols.push({
                key: 'member_account',
                label: 'Account',
                visible: vis.member_account !== false,
                sortable: false,
                render: (_, r) => String(r.member?.company_name ?? `#${r.member?.id}`),
            });
        }

        cols.push(
            {
                key: 'host',
                label: 'Host / IP',
                visible: vis.host !== false,
                sortable: true,
                cellClassName: 'font-mono font-medium',
                render: (_, r) => r.host,
            },
            {
                key: 'label',
                label: 'Etichetta',
                visible: vis.label !== false,
                sortable: true,
                headerClassName: 'text-muted-foreground',
                cellClassName: 'text-muted-foreground',
                render: (_, r) => r.label ?? '—',
            },
            {
                key: 'web_hosting_provider_id',
                label: 'Provider',
                visible: vis.provider !== false,
                sortable: true,
                render: (_, r) => (
                    <>
                        <span className="font-medium">{r.provider_name}</span>
                        <span className="text-muted-foreground ml-1 font-mono text-xs">
                            ({r.provider_slug})
                        </span>
                    </>
                ),
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
                sortable: false,
                headerClassName: 'text-right',
                cellAlign: 'right',
                render: (_, r) => (
                    <div className="flex justify-end gap-2">
                        <ViewButton href={route('modules.web.servers.show', r.id)} />
                        <EditButton href={route('modules.web.servers.edit', r.id)} />
                        <DeleteButton onClick={() => destroyRow(r.id)} />
                    </div>
                ),
            },
        );

        return cols;
    }, [isAdmin, state.visibleColumns]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Server" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-xl font-semibold tracking-tight">Server</h1>
                    <Button asChild>
                        <Link href={route('modules.web.servers.create')}>
                            <Plus className="mr-2 size-4" />
                            Nuovo server
                        </Link>
                    </Button>
                </div>
                <DataTable
                    data={servers.data}
                    columns={columns}
                    pagination={servers.pagination}
                    emptyMessage="Nessun server registrato."
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
