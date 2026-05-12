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
import PageLayout from '@/layouts/page-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type DataTableColumn } from '@/types';
import { Link, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { route } from 'ziggy-js';

interface PlanRow {
    id: number;
    name: string;
    slug: string;
    package_tier: string | null;
    description: string | null;
    price: string | null;
    billing_period: string | null;
    annual_term_months: number;
    trial_days: number;
    max_customers: number | null;
    max_sub_members: number | null;
    is_active: boolean;
    sort_order: number;
    created_at?: string | null;
    updated_at?: string | null;
}

interface Props {
    plans: {
        data: PlanRow[];
        pagination: DataTablePagination;
    };
    filters: {
        sort_field: string;
        sort_order: string;
    };
}

function tierLabel(tier: string | null): string {
    if (!tier) {
        return '—';
    }
    if (tier === 'basic') {
        return 'Basic';
    }
    if (tier === 'premium') {
        return 'Premium';
    }
    if (tier === 'enterprise') {
        return 'Enterprise';
    }
    return tier;
}

export default function LicensePlansIndex({ plans, filters }: Props) {
    useFlashMessages();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Piani licenza', href: route('license-plans.index') },
    ];

    const { state, handlers } = useDataTable({
        initialPerPage: plans.pagination.per_page ?? 25,
        initialSortField: filters.sort_field ?? 'sort_order',
        initialSortOrder: (filters.sort_order as 'asc' | 'desc') ?? 'asc',
        defaultVisibleColumns: {
            package_tier: true,
            name: true,
            slug: true,
            price: true,
            annual_term_months: true,
            max_customers: true,
            sort_order: true,
            is_active: true,
            created_at: false,
            updated_at: true,
            actions: true,
        },
        storageKey: 'settings_license_plans_table',
        routeName: 'license-plans.index',
    });

    const destroyPlan = (id: number) => {
        if (!confirm('Eliminare questo piano licenza?')) {
            return;
        }
        router.delete(route('license-plans.destroy', id), { preserveScroll: true });
    };

    const togglePlanActive = (id: number) => {
        router.post(route('license-plans.toggle-active', id), {}, { preserveScroll: true });
    };

    const columns = useMemo((): DataTableColumn<PlanRow>[] => {
        const vis = state.visibleColumns;

        return [
            {
                key: 'package_tier',
                label: 'Pacchetto',
                visible: vis.package_tier !== false,
                sortable: true,
                headerClassName: 'text-muted-foreground',
                cellClassName: 'text-muted-foreground text-xs',
                render: (_, p) => tierLabel(p.package_tier),
            },
            {
                key: 'name',
                label: 'Nome',
                visible: vis.name !== false,
                sortable: true,
                render: (_, p) => p.name,
            },
            {
                key: 'slug',
                label: 'Slug',
                visible: vis.slug !== false,
                sortable: true,
                headerClassName: 'text-muted-foreground',
                cellClassName: 'text-muted-foreground text-xs',
                render: (_, p) => p.slug,
            },
            {
                key: 'price',
                label: 'Prezzo',
                visible: vis.price !== false,
                sortable: true,
                render: (_, p) =>
                    p.price != null ? (
                        <span>
                            € {p.price}
                            {p.billing_period ? (
                                <span className="text-muted-foreground text-xs">
                                    {' '}
                                    /{' '}
                                    {p.billing_period === 'monthly'
                                        ? 'mensile'
                                        : p.billing_period === 'yearly'
                                          ? 'annuale'
                                          : p.billing_period}
                                </span>
                            ) : null}
                        </span>
                    ) : (
                        '—'
                    ),
            },
            {
                key: 'annual_term_months',
                label: 'Durata',
                visible: vis.annual_term_months !== false,
                sortable: true,
                headerClassName: 'text-muted-foreground',
                cellClassName: 'text-muted-foreground text-xs',
                render: (_, p) => `${p.annual_term_months} mesi`,
            },
            {
                key: 'max_customers',
                label: 'Limiti',
                visible: vis.max_customers !== false,
                sortable: true,
                headerClassName: 'text-muted-foreground',
                cellClassName: 'text-muted-foreground text-xs',
                render: (_, p) => (
                    <>
                        clienti {p.max_customers ?? '∞'} · trial {p.trial_days}g · sub {p.max_sub_members ?? '∞'}
                    </>
                ),
            },
            {
                key: 'sort_order',
                label: 'Ordine',
                visible: vis.sort_order !== false,
                sortable: true,
                render: (_, p) => p.sort_order,
            },
            {
                key: 'is_active',
                label: 'Stato',
                visible: vis.is_active !== false,
                sortable: true,
                render: (_, p) => (
                    <span
                        className={
                            p.is_active ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                        }
                    >
                        {p.is_active ? 'Attivo' : 'Disattivo'}
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
                render: (_, p) => <CreatedAtContent date={p.created_at ?? ''} />,
            },
            {
                key: 'updated_at',
                label: 'Aggiornato',
                visible: vis.updated_at !== false,
                sortable: true,
                headerClassName: 'text-muted-foreground whitespace-nowrap',
                cellClassName: 'text-muted-foreground text-xs whitespace-nowrap',
                render: (_, p) => <UpdatedAtContent date={p.updated_at ?? ''} />,
            },
            {
                key: 'actions',
                label: 'Azioni',
                visible: vis.actions !== false,
                headerAlign: 'right',
                headerClassName: 'text-right',
                cellAlign: 'right',
                sortable: false,
                render: (_, p) => (
                    <div className="flex justify-end gap-2">
                        <ToggleActiveButton isActive={p.is_active} onClick={() => togglePlanActive(p.id)} />
                        <ViewButton href={route('license-plans.show', p.id)} />
                        <EditButton href={route('license-plans.edit', p.id)} />
                        <DeleteButton onClick={() => destroyPlan(p.id)} />
                    </div>
                ),
            },
        ];
    }, [state.visibleColumns]);

    return (
        <PageLayout
            title="Piani licenza"
            description="Prezzi, limiti e funzionalità dei piani assegnabili agli account."
            breadcrumbs={breadcrumbs}
            headerActions={
                <Button asChild>
                    <Link href={route('license-plans.create')}>
                        <Plus className="mr-2 size-4" />
                        Nuovo piano
                    </Link>
                </Button>
            }
        >
            <DataTable
                data={plans.data}
                columns={columns}
                pagination={plans.pagination}
                emptyMessage="Nessun piano definito."
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
