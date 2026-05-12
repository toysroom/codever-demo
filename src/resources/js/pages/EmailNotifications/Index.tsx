import { DataTable, EmailNotificationsAreaTabs, EmailNotificationsClearAllButton, type DataTablePagination } from '@/components/custom';
import { useDataTable, useFlashMessages } from '@/hooks';
import PageLayout from '@/layouts/page-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type DataTableColumn, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { route } from 'ziggy-js';

interface LogRow {
    id: number;
    subject_label: string;
    subject_type: string;
    email_sent_at: string | null;
    notification_sent_at: string | null;
    recipient_email: string | null;
    created_at: string | null;
}

interface Props {
    logs: {
        data: LogRow[];
        pagination: DataTablePagination;
    };
    filters: {
        sort_field: string;
        sort_order: string;
        per_page: number;
    };
}

function formatDateTime(iso: string | null | undefined): string {
    if (!iso) {
        return '—';
    }
    try {
        return format(parseISO(iso), 'dd/MM/yyyy HH:mm');
    } catch {
        return '—';
    }
}

export default function EmailNotificationsIndex({ logs, filters }: Props) {
    useFlashMessages();

    const page = usePage<SharedData>();
    const labels = page.props.ui?.email_notifications_page;

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Dashboard', href: dashboard().url },
            {
                title: labels?.title ?? 'Email e notifiche',
                href: route('email-notifications.index'),
            },
        ],
        [labels?.title],
    );

    const { state, handlers } = useDataTable({
        initialPerPage: logs.pagination.per_page ?? 20,
        initialSortField: filters.sort_field ?? 'created_at',
        initialSortOrder: (filters.sort_order as 'asc' | 'desc') ?? 'desc',
        defaultVisibleColumns: {
            subject_label: true,
            subject_type: true,
            email_sent_at: true,
            notification_sent_at: true,
            recipient_email: true,
            created_at: true,
        },
        storageKey: 'email_notifications_logs_table',
        routeName: 'email-notifications.index',
    });

    const columns = useMemo((): DataTableColumn<LogRow>[] => {
        const vis = state.visibleColumns;

        return [
            {
                key: 'subject_label',
                label: labels?.col_record ?? 'Record',
                visible: vis.subject_label !== false,
                sortable: true,
                render: (_, row) => <span className="font-medium">{row.subject_label}</span>,
            },
            {
                key: 'subject_type',
                label: labels?.col_type ?? 'Tipo',
                visible: vis.subject_type !== false,
                sortable: false,
                headerClassName: 'text-muted-foreground',
                cellClassName: 'text-muted-foreground text-xs',
                render: (_, row) => row.subject_type,
            },
            {
                key: 'email_sent_at',
                label: labels?.col_email_sent ?? 'Email inviata',
                visible: vis.email_sent_at !== false,
                sortable: true,
                render: (v) => formatDateTime(typeof v === 'string' ? v : null),
            },
            {
                key: 'notification_sent_at',
                label: labels?.col_notification_sent ?? 'Notifica inviata',
                visible: vis.notification_sent_at !== false,
                sortable: true,
                render: (v) => formatDateTime(typeof v === 'string' ? v : null),
            },
            {
                key: 'recipient_email',
                label: labels?.col_recipient ?? 'Destinatario email',
                visible: vis.recipient_email !== false,
                sortable: false,
                render: (v) => (typeof v === 'string' && v ? v : '—'),
            },
            {
                key: 'created_at',
                label: labels?.col_created ?? 'Data evento',
                visible: vis.created_at !== false,
                sortable: true,
                render: (v) => formatDateTime(typeof v === 'string' ? v : null),
            },
        ];
    }, [labels, state.visibleColumns]);

    return (
        <PageLayout
            title={labels?.title ?? 'Email e notifiche'}
            description={labels?.description}
            breadcrumbs={breadcrumbs}
        >
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <EmailNotificationsAreaTabs active="log" />
                <EmailNotificationsClearAllButton mode="logs" disabled={logs.pagination.total === 0} />
            </div>
            <DataTable<LogRow>
                data={logs.data}
                columns={columns}
                pagination={logs.pagination}
                emptyMessage={labels?.empty ?? 'Nessun record.'}
                enableRowSelection={false}
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
