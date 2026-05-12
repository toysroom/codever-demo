import {
    CreatedAtContent,
    DataTable,
    IndexTableRowActions,
    UpdatedAtContent,
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

interface MemberSummary {
    id: number;
    company_name: string | null;
    first_name?: string | null;
    last_name?: string | null;
}

interface CustomerRow {
    id: number;
    external_code: string | null;
    company_name: string | null;
    entity_type: string | null;
    first_name: string;
    last_name: string;
    phone: string | null;
    vat_number: string | null;
    is_active?: boolean;
    member?: MemberSummary | null;
    user?: { email: string } | null;
    created_at?: string | null;
    updated_at?: string | null;
}

interface Props {
    customers: {
        data: CustomerRow[];
        pagination: DataTablePagination;
    };
    filters: {
        sort_field: string;
        sort_order: string;
    };
}

export default function CustomersIndex({ customers, filters }: Props) {
    const pageCtx = usePage<SharedData>();
    const isAdmin = pageCtx.props.auth?.user?.user_type === 'admin';
    useFlashMessages();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Clienti', href: '/modules/customers' },
    ];

    const { state, handlers } = useDataTable({
        initialPerPage: customers.pagination.per_page ?? 15,
        initialSortField: filters.sort_field ?? 'last_name',
        initialSortOrder: (filters.sort_order as 'asc' | 'desc') ?? 'asc',
        defaultVisibleColumns: {
            member_account: true,
            client: true,
            entity_type: true,
            vat_number: true,
            email: true,
            phone: true,
            active: true,
            created_at: false,
            updated_at: true,
            actions: true,
        },
        storageKey: 'modules_customers_table',
        routeName: 'modules.customers.index',
    });

    const destroyCustomer = (id: number) => {
        router.delete(`/modules/customers/${id}`, { preserveScroll: true });
    };

    const toggleCustomerActive = (id: number) => {
        router.post(route('modules.customers.toggle-active', id), {}, { preserveScroll: true });
    };

    const columns = useMemo((): DataTableColumn<CustomerRow>[] => {
        const vis = state.visibleColumns;
        const cols: DataTableColumn<CustomerRow>[] = [];

        if (isAdmin) {
            cols.push({
                key: 'member_account',
                label: 'Account',
                visible: vis.member_account !== false,
                sortable: false,
                render: (_, c) =>
                    String(c.member?.company_name ?? (c.member?.id != null ? `#${c.member?.id}` : '—')),
            });
        }

        cols.push(
            {
                key: 'client',
                label: 'Cliente',
                visible: vis.client !== false,
                sortable: true,
                render: (_, c) => (
                    <div className="flex flex-col gap-0.5">
                        <span className="font-medium">
                            {c.company_name?.trim() ? c.company_name : `${c.first_name} ${c.last_name}`}
                        </span>
                        {c.company_name?.trim() ? (
                            <span className="text-muted-foreground text-xs">
                                {c.first_name} {c.last_name}
                            </span>
                        ) : null}
                        {c.external_code?.trim() ? (
                            <span className="text-muted-foreground text-xs">Cod. {c.external_code}</span>
                        ) : null}
                    </div>
                ),
            },
            {
                key: 'entity_type',
                label: 'Tipo',
                visible: vis.entity_type !== false,
                sortable: true,
                headerClassName: 'text-muted-foreground',
                cellClassName: 'text-muted-foreground',
                render: (_, c) => c.entity_type ?? '—',
            },
            {
                key: 'vat_number',
                label: 'P.IVA',
                visible: vis.vat_number !== false,
                sortable: true,
                render: (_, c) => c.vat_number ?? '—',
            },
            {
                key: 'email',
                label: 'Email',
                visible: vis.email !== false,
                sortable: false,
                render: (_, c) => c.user?.email ?? '—',
            },
            {
                key: 'phone',
                label: 'Telefono',
                visible: vis.phone !== false,
                sortable: true,
                render: (_, c) => c.phone ?? '—',
            },
            {
                key: 'active',
                label: 'Attivo',
                visible: vis.active !== false,
                sortable: false,
                render: (_, c) => (
                    <span
                        className={
                            c.is_active !== false
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-muted-foreground'
                        }
                    >
                        {c.is_active !== false ? 'Attivo' : 'Disattivo'}
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
                render: (_, c) => <CreatedAtContent date={c.created_at ?? ''} />,
            },
            {
                key: 'updated_at',
                label: 'Aggiornato',
                visible: vis.updated_at !== false,
                sortable: true,
                headerClassName: 'text-muted-foreground whitespace-nowrap',
                cellClassName: 'text-muted-foreground text-xs whitespace-nowrap',
                render: (_, c) => <UpdatedAtContent date={c.updated_at ?? ''} />,
            },
            {
                key: 'actions',
                label: 'Azioni',
                visible: vis.actions !== false,
                headerAlign: 'right',
                sortable: false,
                headerClassName: 'text-right',
                cellAlign: 'right',
                render: (_, c) => (
                    <IndexTableRowActions
                        toggleActive={{
                            isActive: c.is_active !== false,
                            onClick: () => toggleCustomerActive(c.id),
                        }}
                        showHref={route('modules.customers.show', c.id)}
                        editHref={route('modules.customers.edit', c.id)}
                        onDelete={() => destroyCustomer(c.id)}
                        deleteEntityLabel={`${c.first_name} ${c.last_name}`.trim()}
                    />
                ),
            },
        );

        return cols;
    }, [isAdmin, state.visibleColumns]);

    const handleSort = (field: string, order: 'asc' | 'desc') => {
        let mapped = field;
        if (field === 'client') {
            mapped = 'last_name';
        }
        handlers.handleSort(mapped, order);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clienti" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-xl font-semibold tracking-tight">Clienti</h1>
                    <Button asChild>
                        <Link href="/modules/customers/create">
                            <Plus className="mr-2 size-4" />
                            Nuovo cliente
                        </Link>
                    </Button>
                </div>
                <DataTable<CustomerRow>
                    data={customers.data}
                    columns={columns}
                    pagination={customers.pagination}
                    emptyMessage="Nessun cliente ancora."
                    columnToggleButtonLabel="Personalizza colonne"
                    currentPerPage={state.perPage}
                    onPageChange={handlers.handlePageChange}
                    onPerPageChange={handlers.handlePerPageChange}
                    onColumnToggle={handlers.handleColumnToggle}
                    onSort={handleSort}
                    sortField={state.sortField === 'last_name' ? 'client' : state.sortField}
                    sortOrder={state.sortOrder}
                />
            </div>
        </AppLayout>
    );
}
