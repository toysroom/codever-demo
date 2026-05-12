import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';

export type EmailNotificationsAreaTab = 'log' | 'inbox';

export function EmailNotificationsAreaTabs({ active }: { active: EmailNotificationsAreaTab }) {
    const page = usePage<SharedData>();
    const labels = page.props.ui?.email_notifications_tabs;

    const base =
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

    return (
        <div
            role="tablist"
            aria-label={labels?.aria ?? 'Sezione email e notifiche'}
            className="bg-muted text-muted-foreground mb-6 inline-flex h-10 items-center justify-center rounded-lg p-1"
        >
            <Link
                role="tab"
                aria-selected={active === 'log'}
                href={route('email-notifications.index')}
                prefetch
                className={cn(base, active === 'log' ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground')}
            >
                {labels?.log ?? 'Log invii'}
            </Link>
            <Link
                role="tab"
                aria-selected={active === 'inbox'}
                href={route('notifications.index')}
                prefetch
                className={cn(base, active === 'inbox' ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground')}
            >
                {labels?.inbox ?? 'Notifiche in app'}
            </Link>
        </div>
    );
}
