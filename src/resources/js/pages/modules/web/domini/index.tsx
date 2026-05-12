import { CreatedAtContent, DataTable, IndexTableRowActions, UpdatedAtContent, type DataTablePagination } from '@/components/custom';
import { WebDomainProbeButton } from '@/components/domains/web/web-domain-probe-button';
import { Button } from '@/components/ui/button';
import { useDataTable, useFlashMessages } from '@/hooks';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, DataTableColumn, SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { route } from 'ziggy-js';

interface MemberSummary {
    id: number;
    company_name: string | null;
    first_name?: string | null;
    last_name?: string | null;
}

interface DomainRow {
    id: number;
    hostname: string;
    customer_label: string;
    company_label: string;
    member_label: string;
    member?: MemberSummary | null;
    stack: string | null;
    last_scanned_at: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

interface Props {
    domains: {
        data: DomainRow[];
        pagination: DataTablePagination;
    };
    filters: {
        sort_field: string;
        sort_order: string;
    };
}

export default function DomainsIndex({ domains, filters }: Props) {
    const page = usePage<SharedData>();
    const isAdmin = page.props.auth?.user?.user_type === 'admin';
    useFlashMessages();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Domini', href: route('modules.web.domini.index') },
    ];

    const { state, handlers } = useDataTable({
        initialPerPage: domains.pagination.per_page ?? 15,
        initialSortField: filters.sort_field ?? 'hostname',
        initialSortOrder: (filters.sort_order as 'asc' | 'desc') ?? 'asc',
        defaultVisibleColumns: {
            member_account: true,
            hostname: true,
            customer: true,
            company: true,
            stack: true,
            last_scan: true,
            created_at: false,
            updated_at: true,
            actions: true,
        },
        storageKey: 'modules_web_domains_table',
        routeName: 'modules.web.domini.index',
    });

    const destroyRow = (id: number) => {
        router.delete(route('modules.web.domini.destroy', id), { preserveScroll: true });
    };

    const columns = useMemo((): DataTableColumn<DomainRow>[] => {
        const vis = state.visibleColumns;
        const cols: DataTableColumn<DomainRow>[] = [];

        if (isAdmin) {
            cols.push({
                key: 'member_account',
                label: 'Account',
                visible: vis.member_account !== false,
                sortable: false,
                render: (_, row) => String(row.member?.company_name ?? row.member_label ?? '—'),
            });
        }

        cols.push(
            {
                key: 'hostname',
                label: 'URL',
                visible: vis.hostname !== false,
                sortable: true,
                render: (_, row) => <span className="font-mono font-medium">{row.hostname}</span>,
            },
            {
                key: 'customer',
                label: 'Cliente',
                visible: vis.customer !== false,
                sortable: false,
                render: (_, row) => row.customer_label,
            },
            {
                key: 'company',
                label: 'Azienda',
                visible: vis.company !== false,
                sortable: false,
                render: (_, row) => row.company_label,
            },
            {
                key: 'stack',
                label: 'Stack',
                visible: vis.stack !== false,
                sortable: true,
                cellClassName: 'max-w-[14rem] text-xs leading-snug',
                render: (_, row) => row.stack ?? '—',
            },
            {
                key: 'last_scan',
                label: 'Ultima scansione',
                visible: vis.last_scan !== false,
                sortable: false,
                cellClassName: 'text-muted-foreground whitespace-nowrap text-xs',
                render: (_, row) =>
                    row.last_scanned_at
                        ? new Date(row.last_scanned_at).toLocaleString('it-IT', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                          })
                        : '—',
            },
            {
                key: 'created_at',
                label: 'Creato',
                visible: vis.created_at !== false,
                sortable: true,
                headerClassName: 'text-muted-foreground',
                cellClassName: 'text-muted-foreground whitespace-nowrap text-xs',
                render: (_, row) => <CreatedAtContent date={row.created_at ?? ''} />,
            },
            {
                key: 'updated_at',
                label: 'Aggiornato',
                visible: vis.updated_at !== false,
                sortable: true,
                headerClassName: 'text-muted-foreground',
                cellClassName: 'text-muted-foreground whitespace-nowrap text-xs',
                render: (_, row) => <UpdatedAtContent date={row.updated_at ?? ''} />,
            },
            {
                key: 'actions',
                label: 'Azioni',
                visible: vis.actions !== false,
                headerAlign: 'right',
                sortable: false,
                headerClassName: 'text-right',
                cellAlign: 'right',
                render: (_, row) => (
                    <IndexTableRowActions
                        leading={<WebDomainProbeButton domainId={row.id} hostname={row.hostname} />}
                        showHref={route('modules.web.domini.show', row.id)}
                        editHref={route('modules.web.domini.edit', row.id)}
                        onDelete={() => destroyRow(row.id)}
                        deleteEntityLabel={row.hostname}
                    />
                ),
            },
        );

        return cols;
    }, [isAdmin, state.visibleColumns]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Domini" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-xl font-semibold tracking-tight">Domini</h1>
                    <Button asChild>
                        <Link href={route('modules.web.domini.create')}>
                            <Plus className="mr-2 size-4" />
                            Nuovo dominio
                        </Link>
                    </Button>
                </div>
                <DataTable
                    data={domains.data}
                    columns={columns}
                    pagination={domains.pagination}
                    emptyMessage="Nessun dominio registrato."
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
