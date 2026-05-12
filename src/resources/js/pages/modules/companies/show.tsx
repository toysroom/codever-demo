import { Button } from '@/components/ui/button';
import { StickyReadFooterActions } from '@/components/custom';
import CrudModulePageLayout from '@/layouts/crud-module-page-layout';
import { entityReadonlyCardClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

interface CompanyShow {
    id: number;
    member_label: string | null;
    name: string;
    legal_name: string | null;
    vat_number: string | null;
    email: string | null;
    phone: string | null;
    pec: string | null;
    sdi_recipient_code: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    province: string | null;
    country: string | null;
    notes: string | null;
    is_default: boolean;
    web_domains_count: number;
}

interface Props {
    company: CompanyShow;
}

export default function CompaniesShow({ company }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Aziende', href: route('modules.companies.index') },
        { title: company.name },
    ];

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title={company.name}
            documentTitle={company.name}
            stickyBar={
                <StickyReadFooterActions listHref={route('modules.companies.index')}>
                    <Button asChild>
                        <Link href={route('modules.companies.edit', company.id)}>Modifica</Link>
                    </Button>
                </StickyReadFooterActions>
            }
        >
            <dl className={entityReadonlyCardClassName('grid w-full gap-3 p-6 text-sm')}>
                {company.member_label ? (
                    <>
                        <dt className="text-muted-foreground">Account</dt>
                        <dd className="font-medium">{company.member_label}</dd>
                    </>
                ) : null}
                <dt className="text-muted-foreground">Ragione sociale</dt>
                <dd>{company.legal_name ?? '—'}</dd>
                <dt className="text-muted-foreground">Predefinita</dt>
                <dd>{company.is_default ? 'Sì' : 'No'}</dd>
                <dt className="text-muted-foreground">Domini collegati</dt>
                <dd>{company.web_domains_count}</dd>
                <dt className="text-muted-foreground">Partita IVA</dt>
                <dd>{company.vat_number ?? '—'}</dd>
                <dt className="text-muted-foreground">Codice SDI</dt>
                <dd>{company.sdi_recipient_code ?? '—'}</dd>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{company.email ?? '—'}</dd>
                <dt className="text-muted-foreground">PEC</dt>
                <dd>{company.pec ?? '—'}</dd>
                <dt className="text-muted-foreground">Telefono</dt>
                <dd>{company.phone ?? '—'}</dd>
                <dt className="text-muted-foreground">Indirizzo</dt>
                <dd className="whitespace-pre-wrap">{company.address ?? '—'}</dd>
                <dt className="text-muted-foreground">Località</dt>
                <dd>
                    {[company.postal_code, company.city, company.province, company.country].filter(Boolean).join(' ') || '—'}
                </dd>
                <dt className="text-muted-foreground">Note</dt>
                <dd className="whitespace-pre-wrap">{company.notes ?? '—'}</dd>
            </dl>
        </CrudModulePageLayout>
    );
}
