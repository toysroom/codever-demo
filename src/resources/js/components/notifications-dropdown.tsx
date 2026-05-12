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
    const href = item.data.href;
    const unread = !item.read_at;

    const open = () => {
        if (unread) {
            router.post(
                route('notifications.read', item.id),
                {},
                {
                    preserveScroll: true,
                    onFinish: () => {
                        if (href) {
                            router.visit(href);
                        }
                    },
                },
            );

            return;
        }
        if (href) {
            router.visit(href);
        }
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
    const unread = raw?.unread_count ?? 0;
    const items = raw?.items ?? [];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 shrink-0" type="button" aria-label="Notifiche">
                    <Bell className="size-5" />
                    {unread > 0 ? (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                            {unread > 99 ? '99+' : unread}
                        </span>
                    ) : null}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96">
                <DropdownMenuLabel className="flex items-center justify-between gap-2">
                    <span>Notifiche</span>
                    {unread > 0 ? (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" type="button" onClick={() => router.post(route('notifications.read-all'), {}, { preserveScroll: true })}>
                            Segna tutte lette
                        </Button>
                    ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {items.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">Nessuna notifica</div>
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
