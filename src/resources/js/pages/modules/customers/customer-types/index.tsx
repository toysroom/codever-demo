import {
    CreatedAtContent,
    DataTable,
    DeleteButton,
    EditButton,
    ToggleActiveButton,
    UpdatedAtContent,
    ViewButton,
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
}

interface CustomerTypeRow {
    id: number;
    name: string;
    description: string | null;
    sort_order: number;
    is_active?: boolean;
    customers_count: number;
    member?: MemberSummary | null;
    created_at?: string | null;
    updated_at?: string | null;
}

interface Props {
    customerTypes: {
        data: CustomerTypeRow[];
        pagination: DataTablePagination;
    };
    filters: {
        sort_field: string;
        sort_order: string;
    };
}

export default function CustomerTypesIndex({ customerTypes, filters }: Props) {
    const page = usePage<SharedData>();
    const isAdmin = page.props.auth?.user?.user_type === 'admin';
    useFlashMessages();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Tipi cliente', href: route('modules.customers.customer-types.index') },
    ];

    const { state, handlers } = useDataTable({
        initialPerPage: customerTypes.pagination.per_page ?? 15,
        initialSortField: filters.sort_field ?? 'sort_order',
        initialSortOrder: (filters.sort_order as 'asc' | 'desc') ?? 'asc',
        defaultVisibleColumns: {
            member_account: true,
            name: true,
            description: true,
            sort_order: true,
            customers_count: true,
            is_active: true,
            created_at: false,
            updated_at: true,
            actions: true,
        },
        storageKey: 'modules_customers_customer_types_table',
        routeName: 'modules.customers.customer-types.index',
    });

    const destroyRow = (id: number) => {
        if (!confirm('Eliminare questo tipo cliente? I collegamenti con i clienti verranno rimossi.')) {
            return;
        }
        router.delete(route('modules.customers.customer-types.destroy', id), { preserveScroll: true });
    };

    const toggleRow = (id: number) => {
        router.post(route('modules.customers.customer-types.toggle-active', id), {}, { preserveScroll: true });
    };

    const columns = useMemo((): DataTableColumn<CustomerTypeRow>[] => {
        const vis = state.visibleColumns;
        const cols: DataTableColumn<CustomerTypeRow>[] = [];

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
                key: 'name',
                label: 'Nome',
                visible: vis.name !== false,
                sortable: true,
                render: (_, row) => row.name,
            },
            {
                key: 'description',
                label: 'Descrizione',
                visible: vis.description !== false,
                sortable: false,
                headerClassName: 'text-muted-foreground',
                cellClassName: 'text-muted-foreground max-w-xs truncate',
                render: (_, row) => row.description ?? '—',
            },
            {
                key: 'sort_order',
                label: 'Ordine',
                visible: vis.sort_order !== false,
                sortable: true,
                render: (_, row) => row.sort_order,
            },
            {
                key: 'customers_count',
                label: 'Clienti',
                visible: vis.customers_count !== false,
                sortable: true,
                render: (_, row) => row.customers_count,
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
                    <div className="flex justify-end gap-2">
                        <ToggleActiveButton
                            isActive={row.is_active !== false}
                            onClick={() => toggleRow(row.id)}
                        />
                        <ViewButton href={route('modules.customers.customer-types.show', row.id)} />
                        <EditButton href={route('modules.customers.customer-types.edit', row.id)} />
                        <DeleteButton onClick={() => destroyRow(row.id)} />
                    </div>
                ),
            },
        );

        return cols;
    }, [isAdmin, state.visibleColumns]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tipi cliente" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-xl font-semibold tracking-tight">Tipi cliente</h1>
                    <Button asChild>
                        <Link href={route('modules.customers.customer-types.create')}>
                            <Plus className="mr-2 size-4" />
                            Nuovo tipo
                        </Link>
                    </Button>
                </div>
                <DataTable
                    data={customerTypes.data}
                    columns={columns}
                    pagination={customerTypes.pagination}
                    emptyMessage="Nessun tipo definito."
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
