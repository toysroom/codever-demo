import { Button } from '@/components/ui/button';
import { StickyReadFooterActions } from '@/components/custom';
import CrudModulePageLayout from '@/layouts/crud-module-page-layout';
import { entityReadonlyCardClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

interface PriceListShow {
    id: number;
    member_label: string | null;
    name: string;
    code: string | null;
    currency: string;
    valid_from: string | null;
    valid_to: string | null;
    is_default: boolean;
    notes: string | null;
}

interface Props {
    priceList: PriceListShow;
}

export default function PriceListsShow({ priceList }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Listini', href: route('modules.products.listini.index') },
        { title: priceList.name },
    ];

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title={priceList.name}
            documentTitle={priceList.name}
            stickyBar={
                <StickyReadFooterActions listHref={route('modules.products.listini.index')}>
                    <Button asChild>
                        <Link href={route('modules.products.listini.edit', priceList.id)}>Modifica</Link>
                    </Button>
                </StickyReadFooterActions>
            }
        >
            <dl className={entityReadonlyCardClassName('grid w-full gap-3 p-6 text-sm')}>
                {priceList.member_label ? (
                    <>
                        <dt className="text-muted-foreground">Account</dt>
                        <dd className="font-medium">{priceList.member_label}</dd>
                    </>
                ) : null}
                <dt className="text-muted-foreground">Codice</dt>
                <dd>{priceList.code ?? '—'}</dd>
                <dt className="text-muted-foreground">Valuta</dt>
                <dd>{priceList.currency}</dd>
                <dt className="text-muted-foreground">Validità</dt>
                <dd>
                    {priceList.valid_from ?? '—'} → {priceList.valid_to ?? '—'}
                </dd>
                <dt className="text-muted-foreground">Predefinito</dt>
                <dd>{priceList.is_default ? 'Sì' : 'No'}</dd>
                <dt className="text-muted-foreground">Note</dt>
                <dd className="whitespace-pre-wrap">{priceList.notes ?? '—'}</dd>
            </dl>
        </CrudModulePageLayout>
    );
}
