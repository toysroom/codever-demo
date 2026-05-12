import { Button } from '@/components/ui/button';
import { StickyReadFooterActions } from '@/components/custom';
import CrudModulePageLayout from '@/layouts/crud-module-page-layout';
import { entityReadonlyCardClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

interface CustomerTypeShow {
    id: number;
    member_label: string | null;
    name: string;
    description: string | null;
    sort_order: number;
    customers_count: number;
    is_active: boolean;
}

interface Props {
    customerType: CustomerTypeShow;
}

export default function CustomerTypesShow({ customerType }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Tipi cliente', href: route('modules.customers.customer-types.index') },
        { title: customerType.name },
    ];

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title={customerType.name}
            documentTitle={customerType.name}
            stickyBar={
                <StickyReadFooterActions listHref={route('modules.customers.customer-types.index')}>
                    <Button asChild>
                        <Link href={route('modules.customers.customer-types.edit', customerType.id)}>Modifica</Link>
                    </Button>
                </StickyReadFooterActions>
            }
        >
            <dl className={entityReadonlyCardClassName('grid w-full gap-3 p-6 text-sm')}>
                {customerType.member_label ? (
                    <>
                        <dt className="text-muted-foreground">Account</dt>
                        <dd className="font-medium">{customerType.member_label}</dd>
                    </>
                ) : null}
                <dt className="text-muted-foreground">Descrizione</dt>
                <dd>{customerType.description ?? '—'}</dd>
                <dt className="text-muted-foreground">Ordine</dt>
                <dd>{customerType.sort_order}</dd>
                <dt className="text-muted-foreground">Clienti collegati</dt>
                <dd>{customerType.customers_count}</dd>
                <dt className="text-muted-foreground">Stato</dt>
                <dd>{customerType.is_active ? 'Attivo' : 'Disattivo'}</dd>
            </dl>
        </CrudModulePageLayout>
    );
}
