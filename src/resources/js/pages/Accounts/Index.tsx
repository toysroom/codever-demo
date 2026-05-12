import {
    CreatedAtContent,
    DataTable,
    DeleteButton,
    EditButton,
    SearchInput,
    ToggleActiveButton,
    UpdatedAtContent,
    ViewButton,
    PageHeaderActions,
    type DataTablePagination,
} from '@/components/custom';
import { Button } from '@/components/ui/button';
import { useDataTable, useFlashMessages } from '@/hooks';
import PageLayout from '@/layouts/page-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type DataTableColumn } from '@/types';
import { Link, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { route } from 'ziggy-js';

interface UserSummary {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
}

interface PlanSummary {
    id: number;
    name: string;
    slug: string;
}

interface AccountRow {
    id: number;
    company_name: string | null;
    company_vat: string | null;
    max_customers: number | null;
    max_sub_members: number | null;
    subscription_status: string | null;
    user: UserSummary;
    license_plan: PlanSummary | null;
    created_at?: string | null;
    updated_at?: string | null;
}

interface Props {
    accounts: {
        data: AccountRow[];
        pagination: DataTablePagination;
    };
    filters: {
        search: string;
        sort_field: string;
        sort_order: string;
    };
}

export default function AccountsIndex({ accounts, filters }: Props) {
    useFlashMessages();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Account', href: route('accounts.index') },
    ];

    const { state, handlers } = useDataTable({
        initialPerPage: accounts.pagination.per_page ?? 20,
        initialSortField: filters.sort_field ?? 'company_name',
        initialSortOrder: (filters.sort_order as 'asc' | 'desc') ?? 'asc',
        defaultVisibleColumns: {
            company_name: true,
            owner_name: true,
            owner_email: true,
            license_plan_name: true,
            max_customers: true,
            user_active: true,
            created_at: false,
            updated_at: true,
            actions: true,
        },
        storageKey: 'settings_accounts_table',
        routeName: 'accounts.index',
    });

    const destroyAccount = (id: number) => {
        if (!confirm('Eliminare questo account e il suo utente owner?')) {
            return;
        }
        router.delete(route('accounts.destroy', id), { preserveScroll: true });
    };

    const toggleOwnerActive = (id: number) => {
        router.post(route('accounts.toggle-active', id), {}, { preserveScroll: true });
    };

    const columns = useMemo((): DataTableColumn<AccountRow>[] => {
        const vis = state.visibleColumns;

        return [
            {
                key: 'company_name',
                label: 'Account',
                visible: vis.company_name !== false,
                sortable: true,
                render: (_, t) => (
                    <div>
                        <div className="font-medium">{t.company_name ?? '—'}</div>
                        {t.company_vat ? (
                            <div className="text-muted-foreground text-xs">P.IVA {t.company_vat}</div>
                        ) : null}
                        <div className="text-muted-foreground text-xs">
                            Stato: {t.subscription_status ?? '—'}
                        </div>
                    </div>
                ),
            },
            {
                key: 'owner_name',
                label: 'Owner',
                visible: vis.owner_name !== false,
                sortable: true,
                render: (_, t) => t.user.name,
            },
            {
                key: 'owner_email',
                label: 'Email',
                visible: vis.owner_email !== false,
                sortable: true,
                render: (_, t) => (
                    <span className={t.user.is_active ? '' : 'text-muted-foreground line-through'}>
                        {t.user.email}
                    </span>
                ),
            },
            {
                key: 'license_plan_name',
                label: 'Piano',
                visible: vis.license_plan_name !== false,
                sortable: true,
                render: (_, t) => t.license_plan?.name ?? '—',
            },
            {
                key: 'max_customers',
                label: 'Limiti',
                visible: vis.max_customers !== false,
                sortable: true,
                headerClassName: 'text-muted-foreground',
                cellClassName: 'text-muted-foreground text-xs',
                render: (_, t) => (
                    <>
                        clienti {t.max_customers ?? '∞'} · sub {t.max_sub_members ?? '∞'}
                    </>
                ),
            },
            {
                key: 'user_active',
                label: 'Attivo',
                visible: vis.user_active !== false,
                sortable: false,
                render: (_, t) => (
                    <span
                        className={
                            t.user.is_active
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-muted-foreground'
                        }
                    >
                        {t.user.is_active ? 'Attivo' : 'Disattivo'}
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
                render: (_, t) => <CreatedAtContent date={t.created_at ?? ''} />,
            },
            {
                key: 'updated_at',
                label: 'Aggiornato',
                visible: vis.updated_at !== false,
                sortable: true,
                headerClassName: 'text-muted-foreground whitespace-nowrap',
                cellClassName: 'text-muted-foreground text-xs whitespace-nowrap',
                render: (_, t) => <UpdatedAtContent date={t.updated_at ?? ''} />,
            },
            {
                key: 'actions',
                label: 'Azioni',
                visible: vis.actions !== false,
                headerAlign: 'right',
                headerClassName: 'text-right',
                cellAlign: 'right',
                sortable: false,
                render: (_, t) => (
                    <div className="flex justify-end gap-2">
                        <ToggleActiveButton isActive={t.user.is_active} onClick={() => toggleOwnerActive(t.id)} />
                        <ViewButton href={route('accounts.show', t.id)} />
                        <EditButton href={route('accounts.edit', t.id)} />
                        <DeleteButton onClick={() => destroyAccount(t.id)} />
                    </div>
                ),
            },
        ];
    }, [state.visibleColumns]);

    return (
        <PageLayout
            title="Account"
            description="Organizzazioni principali (member owner), piano licenza e utente owner."
            breadcrumbs={breadcrumbs}
            headerActions={
                <Button asChild>
                    <Link href={route('accounts.create')}>
                        <Plus className="mr-2 size-4" />
                        Nuovo account
                    </Link>
                </Button>
            }
        >
            <PageHeaderActions>
                <div className="w-full sm:w-96">
                    <SearchInput
                        value={state.search}
                        onSearch={handlers.handleSearch}
                        placeholder="Ragione sociale, email o nome owner…"
                        className="w-full"
                    />
                </div>
            </PageHeaderActions>

            <DataTable
                data={accounts.data}
                columns={columns}
                pagination={accounts.pagination}
                emptyMessage="Nessun account."
                columnToggleButtonLabel="Personalizza colonne"
                currentPerPage={state.perPage}
                onPageChange={handlers.handlePageChange}
                onPerPageChange={handlers.handlePerPageChange}
                onColumnToggle={handlers.handleColumnToggle}
                onSort={handlers.handleSort}
                sortField={state.sortField}
                sortOrder={state.sortOrder}
            />
        </PageLayout>
    );
}
