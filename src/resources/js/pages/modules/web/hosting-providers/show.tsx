import { Button } from '@/components/ui/button';
import { StickyReadFooterActions } from '@/components/custom';
import CrudModulePageLayout from '@/layouts/crud-module-page-layout';
import { entityReadonlyCardClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

interface Props {
    provider: {
        id: number;
        slug: string;
        name: string;
        website_url: string | null;
        servers_count: number;
    };
}

export default function HostingProvidersShow({ provider }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Fornitori hosting', href: route('modules.web.hosting-providers.index') },
        { title: provider.name },
    ];

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title={provider.name}
            documentTitle={provider.name}
            stickyBar={
                <StickyReadFooterActions listHref={route('modules.web.hosting-providers.index')}>
                    <Button asChild>
                        <Link href={route('modules.web.hosting-providers.edit', provider.id)}>Modifica</Link>
                    </Button>
                </StickyReadFooterActions>
            }
        >
            <dl className={entityReadonlyCardClassName('grid w-full gap-3 p-6 text-sm')}>
                <dt className="text-muted-foreground">Slug</dt>
                <dd className="font-mono text-xs font-medium">{provider.slug}</dd>
                <dt className="text-muted-foreground">Sito web</dt>
                <dd>
                    {provider.website_url ? (
                        <a href={provider.website_url} className="underline" target="_blank" rel="noreferrer">
                            {provider.website_url}
                        </a>
                    ) : (
                        '—'
                    )}
                </dd>
                <dt className="text-muted-foreground">Server collegati</dt>
                <dd>{provider.servers_count}</dd>
            </dl>
        </CrudModulePageLayout>
    );
}
