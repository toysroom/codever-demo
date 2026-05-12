import { CreatedAtContent, DataTable, IndexTableRowActions, UpdatedAtContent, type DataTablePagination } from '@/components/custom';
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

interface CompanyRow {
    id: number;
    name: string;
    legal_name: string | null;
    vat_number: string | null;
    email: string | null;
    is_default: boolean;
    web_domains_count: number;
    member?: MemberSummary | null;
    created_at?: string | null;
    updated_at?: string | null;
}

interface Props {
    companies: {
        data: CompanyRow[];
        pagination: DataTablePagination;
    };
    filters: {
        sort_field: string;
        sort_order: string;
    };
}

export default function CompaniesIndex({ companies, filters }: Props) {
    const page = usePage<SharedData>();
    const isAdmin = page.props.auth?.user?.user_type === 'admin';
    useFlashMessages();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Aziende', href: route('modules.companies.index') },
    ];

    const { state, handlers } = useDataTable({
        initialPerPage: companies.pagination.per_page ?? 15,
        initialSortField: filters.sort_field ?? 'name',
        initialSortOrder: (filters.sort_order as 'asc' | 'desc') ?? 'asc',
        defaultVisibleColumns: {
            member_account: true,
            name: true,
            legal_name: true,
            vat_number: true,
            email: true,
            is_default: true,
            web_domains_count: true,
            created_at: false,
            updated_at: true,
            actions: true,
        },
        storageKey: 'modules_companies_table',
        routeName: 'modules.companies.index',
    });

    const destroyRow = (id: number) => {
        router.delete(route('modules.companies.destroy', id), { preserveScroll: true });
    };

    const columns = useMemo((): DataTableColumn<CompanyRow>[] => {
        const vis = state.visibleColumns;
        const cols: DataTableColumn<CompanyRow>[] = [];

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
                key: 'name',
                label: 'Nome',
                visible: vis.name !== false,
                sortable: true,
                render: (_, c) => c.name,
            },
            {
                key: 'legal_name',
                label: 'Ragione sociale',
                visible: vis.legal_name !== false,
                sortable: true,
                headerClassName: 'text-muted-foreground',
                cellClassName: 'text-muted-foreground',
                render: (_, c) => c.legal_name ?? '—',
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
                sortable: true,
                render: (_, c) => c.email ?? '—',
            },
            {
                key: 'is_default',
                label: 'Predef.',
                visible: vis.is_default !== false,
                sortable: true,
                render: (_, c) =>
                    c.is_default ? (
                        <span className="text-green-600 dark:text-green-400">Sì</span>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    ),
            },
            {
                key: 'web_domains_count',
                label: 'Domini',
                visible: vis.web_domains_count !== false,
                sortable: true,
                render: (_, c) => c.web_domains_count,
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
                        showHref={route('modules.companies.show', c.id)}
                        editHref={route('modules.companies.edit', c.id)}
                        onDelete={() => destroyRow(c.id)}
                        deleteEntityLabel={c.name}
                    />
                ),
            },
        );

        return cols;
    }, [isAdmin, state.visibleColumns]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Aziende" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-xl font-semibold tracking-tight">Aziende</h1>
                    <Button asChild>
                        <Link href={route('modules.companies.create')}>
                            <Plus className="mr-2 size-4" />
                            Nuova azienda
                        </Link>
                    </Button>
                </div>
                <DataTable
                    data={companies.data}
                    columns={columns}
                    pagination={companies.pagination}
                    emptyMessage="Nessuna azienda ancora."
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
