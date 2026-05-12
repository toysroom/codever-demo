import { EmailNotificationsAreaTabs, EmailNotificationsClearAllButton } from '@/components/custom';
import { Button } from '@/components/ui/button';
import { useFlashMessages } from '@/hooks';
import PageLayout from '@/layouts/page-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type DataTablePagination, type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { route } from 'ziggy-js';
import { cn } from '@/lib/utils';

interface InboxRow {
    id: string;
    type: string;
    data: Record<string, unknown>;
    read_at: string | null;
    created_at: string;
}

interface Props {
    inbox: {
        data: InboxRow[];
        pagination: DataTablePagination;
    };
    filters: {
        per_page: number;
    };
    highlight_notification_id: string | null;
}

function isInboxNotificationUrl(href: string): boolean {
    try {
        const { pathname } = new URL(href);
        if (pathname.endsWith('/notifications') || pathname.endsWith('/notifications/')) {
            return true;
        }
        return pathname.includes('/email-notifications/inbox');
    } catch {
        return href.includes('/notifications') || href.includes('email-notifications/inbox');
    }
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

export default function NotificationsIndex({ inbox, filters, highlight_notification_id }: Props) {
    useFlashMessages();

    const page = usePage<SharedData>();
    const labels = page.props.ui?.notifications_inbox_page;
    const emailSectionTitle = page.props.ui?.email_notifications_page?.title ?? 'Email e notifiche';
    const highlightRef = useRef<string | null>(null);

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Dashboard', href: dashboard().url },
            { title: emailSectionTitle, href: route('email-notifications.index') },
            { title: labels?.title ?? 'Notifiche in app', href: route('notifications.index') },
        ],
        [labels?.title, emailSectionTitle],
    );

    useEffect(() => {
        if (!highlight_notification_id) {
            highlightRef.current = null;

            return;
        }

        const id = highlight_notification_id;
        if (highlightRef.current === id) {
            return;
        }
        highlightRef.current = id;
        const t = window.setTimeout(() => {
            const el = document.getElementById(`notification-${id}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        return () => window.clearTimeout(t);
    }, [highlight_notification_id]);

    const visitPage = (overrides: Record<string, string | number>) => {
        router.get(
            route('notifications.index'),
            {
                per_page: filters.per_page,
                ...overrides,
            },
            { preserveScroll: true, replace: true },
        );
    };

    const p = inbox.pagination;

    return (
        <PageLayout title={labels?.title ?? 'Notifiche in app'} description={labels?.description} breadcrumbs={breadcrumbs}>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <EmailNotificationsAreaTabs active="inbox" />
                <EmailNotificationsClearAllButton mode="inbox" disabled={p.total === 0} />
            </div>
            <div className="flex flex-col gap-3">
                {inbox.data.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{labels?.empty ?? 'Nessuna notifica.'}</p>
                ) : (
                    inbox.data.map((row) => {
                        const title = typeof row.data.title === 'string' ? row.data.title : 'Notifica';
                        const body = typeof row.data.body === 'string' ? row.data.body : '';
                        const customerHref = typeof row.data.customer_href === 'string' ? row.data.customer_href : null;
                        const rawHref = typeof row.data.href === 'string' ? row.data.href : null;
                        const relatedHref =
                            customerHref ?? (rawHref && !isInboxNotificationUrl(rawHref) ? rawHref : null);
                        const isHighlighted = highlight_notification_id === row.id;
                        const isRead = row.read_at != null;

                        return (
                            <article
                                key={row.id}
                                id={`notification-${row.id}`}
                                className={cn(
                                    'rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow',
                                    isHighlighted && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                                )}
                            >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-base font-semibold leading-tight">{title}</h2>
                                            <span
                                                className={cn(
                                                    'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                                                    isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary',
                                                )}
                                            >
                                                {isRead ? (labels?.read_label ?? 'Letta') : (labels?.unread_label ?? 'Non letta')}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">{row.type}</span>
                                        </div>
                                        {body ? <p className="text-sm text-muted-foreground">{body}</p> : null}
                                        <p className="text-xs text-muted-foreground">{formatDateTime(row.created_at)}</p>
                                    </div>
                                    {relatedHref ? (
                                        <Button variant="outline" size="sm" className="shrink-0 gap-1" asChild>
                                            <a href={relatedHref}>
                                                {labels?.open_related ?? 'Apri collegamento'}
                                                <ExternalLink className="size-3.5" />
                                            </a>
                                        </Button>
                                    ) : null}
                                </div>
                            </article>
                        );
                    })
                )}

                {(p.last_page ?? 1) > 1 ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                        <p className="text-muted-foreground text-sm">
                            {labels?.page_label ?? 'Pagina'} {p.current_page} / {p.last_page ?? 1}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={p.current_page <= 1}
                                onClick={() => visitPage({ page: p.current_page - 1 })}
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={p.current_page >= (p.last_page ?? 1)}
                                onClick={() => visitPage({ page: p.current_page + 1 })}
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                ) : null}

                <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                    <span>{labels?.per_page_label ?? 'Per pagina'}:</span>
                    {[15, 20, 25, 50].map((n) => (
                        <Button
                            key={n}
                            type="button"
                            variant={filters.per_page === n ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => visitPage({ per_page: n, page: 1 })}
                        >
                            {n}
                        </Button>
                    ))}
                </div>
            </div>
        </PageLayout>
    );
}
