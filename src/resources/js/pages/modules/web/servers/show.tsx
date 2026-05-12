import { Button } from '@/components/ui/button';
import { StickyReadFooterActions } from '@/components/custom';
import CrudModulePageLayout from '@/layouts/crud-module-page-layout';
import { entityReadonlyCardClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

interface Props {
    server: {
        id: number;
        label: string | null;
        host: string;
        notes: string | null;
        member_label: string;
        provider_name: string;
        provider_slug: string;
    };
}

export default function ServersShow({ server }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Server', href: route('modules.web.servers.index') },
        { title: server.host },
    ];

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title={server.host}
            documentTitle={server.host}
            stickyBar={
                <StickyReadFooterActions listHref={route('modules.web.servers.index')}>
                    <Button asChild>
                        <Link href={route('modules.web.servers.edit', server.id)}>Modifica</Link>
                    </Button>
                </StickyReadFooterActions>
            }
        >
            <dl className={entityReadonlyCardClassName('grid w-full gap-3 p-6 text-sm')}>
                <dt className="text-muted-foreground">Account</dt>
                <dd className="font-medium">{server.member_label}</dd>
                <dt className="text-muted-foreground">Fornitore</dt>
                <dd>
                    {server.provider_name}{' '}
                    <span className="text-muted-foreground font-mono text-xs">({server.provider_slug})</span>
                </dd>
                <dt className="text-muted-foreground">Etichetta</dt>
                <dd>{server.label ?? '—'}</dd>
                <dt className="text-muted-foreground">Note</dt>
                <dd className="whitespace-pre-wrap">{server.notes ?? '—'}</dd>
            </dl>
        </CrudModulePageLayout>
    );
}
