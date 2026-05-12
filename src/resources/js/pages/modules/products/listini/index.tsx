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
    first_name?: string | null;
    last_name?: string | null;
}

interface PriceListRow {
    id: number;
    name: string;
    code: string | null;
    currency: string;
    is_default: boolean;
    is_active?: boolean;
    member?: MemberSummary | null;
    created_at?: string | null;
    updated_at?: string | null;
}

interface Props {
    priceLists: {
        data: PriceListRow[];
        pagination: DataTablePagination;
    };
    filters: {
        sort_field: string;
        sort_order: string;
    };
}

export default function PriceListsIndex({ priceLists, filters }: Props) {
    const page = usePage<SharedData>();
    const isAdmin = page.props.auth?.user?.user_type === 'admin';
    useFlashMessages();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Listini', href: route('modules.products.listini.index') },
    ];

    const { state, handlers } = useDataTable({
        initialPerPage: priceLists.pagination.per_page ?? 15,
        initialSortField: filters.sort_field ?? 'name',
        initialSortOrder: (filters.sort_order as 'asc' | 'desc') ?? 'asc',
        defaultVisibleColumns: {
            member_account: true,
            name: true,
            code: true,
            currency: true,
            is_default: true,
            is_active: true,
            created_at: false,
            updated_at: true,
            actions: true,
        },
        storageKey: 'modules_products_price_lists_table',
        routeName: 'modules.products.listini.index',
    });

    const destroyRow = (id: number) => {
        if (!confirm('Eliminare questo listino?')) {
            return;
        }
        router.delete(route('modules.products.listini.destroy', id), { preserveScroll: true });
    };

    const toggleRow = (id: number) => {
        router.post(route('modules.products.listini.toggle-active', id), {}, { preserveScroll: true });
    };

    const columns = useMemo((): DataTableColumn<PriceListRow>[] => {
        const vis = state.visibleColumns;
        const cols: DataTableColumn<PriceListRow>[] = [];

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
                key: 'code',
                label: 'Codice',
                visible: vis.code !== false,
                sortable: true,
                headerClassName: 'text-muted-foreground',
                cellClassName: 'text-muted-foreground',
                render: (_, row) => row.code ?? '—',
            },
            {
                key: 'currency',
                label: 'Valuta',
                visible: vis.currency !== false,
                sortable: true,
                render: (_, row) => row.currency,
            },
            {
                key: 'is_default',
                label: 'Predefinito',
                visible: vis.is_default !== false,
                sortable: true,
                render: (_, row) => (row.is_default ? 'Sì' : '—'),
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
                        <ViewButton href={route('modules.products.listini.show', row.id)} />
                        <EditButton href={route('modules.products.listini.edit', row.id)} />
                        <DeleteButton onClick={() => destroyRow(row.id)} />
                    </div>
                ),
            },
        );

        return cols;
    }, [isAdmin, state.visibleColumns]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Listini" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-xl font-semibold tracking-tight">Listini prezzi</h1>
                    <Button asChild>
                        <Link href={route('modules.products.listini.create')}>
                            <Plus className="mr-2 size-4" />
                            Nuovo listino
                        </Link>
                    </Button>
                </div>
                <DataTable
                    data={priceLists.data}
                    columns={columns}
                    pagination={priceLists.pagination}
                    emptyMessage="Nessun listino. Importa dal file Excel o creane uno nuovo."
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
