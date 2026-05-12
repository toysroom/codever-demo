import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { NotificationItem, SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { format, parseISO } from 'date-fns';

function NotificationRow({ item }: { item: NotificationItem }) {
    const title = item.data.title ?? 'Notifica';
    const body = item.data.body ?? '';
    const unread = !item.read_at;

    const open = () => {
        router.visit(route('notifications.index', { notification: item.id }));
    };

    return (
        <DropdownMenuItem className="cursor-pointer items-start gap-2 py-2" onSelect={(e) => e.preventDefault()} onClick={open}>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
                <span className={cn('truncate text-sm font-medium', unread && 'text-foreground')}>{title}</span>
                {body ? <span className="line-clamp-2 text-xs text-muted-foreground">{body}</span> : null}
                <span className="text-[10px] text-muted-foreground">{format(parseISO(item.created_at), 'dd/MM/yyyy HH:mm')}</span>
            </div>
        </DropdownMenuItem>
    );
}

export function NotificationsDropdown() {
    const page = usePage<SharedData>();
    const raw = page.props.notifications;
    const unreadCount = raw?.unread_count ?? 0;
    const items = raw?.items ?? [];
    const t = page.props.ui?.notifications_bell ?? {};
    const badgeLabel =
        unreadCount > 99
            ? '99+'
            : String(unreadCount);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 shrink-0 overflow-visible"
                    type="button"
                    aria-label={
                        unreadCount > 0 ? `${t.title ?? 'Notifiche'} (${unreadCount})` : (t.title ?? 'Notifiche')
                    }
                >
                    <Bell className="size-5" />
                    {unreadCount > 0 ? (
                        <Badge
                            variant="destructive"
                            className="pointer-events-none absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background px-1 py-0 text-[10px] font-semibold leading-none tabular-nums"
                            aria-hidden
                        >
                            {badgeLabel}
                        </Badge>
                    ) : null}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96">
                <DropdownMenuLabel className="flex items-center justify-between gap-2">
                    <span>{t.title ?? 'Notifiche'}</span>
                    {unreadCount > 0 ? (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" type="button" onClick={() => router.post(route('notifications.read-all'), {}, { preserveScroll: true })}>
                            {t.mark_all_read ?? 'Segna tutte lette'}
                        </Button>
                    ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {items.length === 0 ? (
                    <div className="text-muted-foreground px-2 py-6 text-center text-sm">{t.empty_unread ?? 'Nessuna notifica da leggere'}</div>
                ) : (
                    <div className="max-h-80 overflow-y-auto">
                        {items.map((item) => (
                            <NotificationRow key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
