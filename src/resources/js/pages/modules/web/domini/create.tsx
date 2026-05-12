import { StickyReadFooterActions } from '@/components/custom';
import { WebDomainAnagraficaFields } from '@/components/domains/web/web-domain-anagrafica-fields';
import { Button } from '@/components/ui/button';
import CrudModulePageLayout from '@/layouts/crud-module-page-layout';
import { moduleFormSurfaceClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type MemberOwnerOption } from '@/types';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useEffect, useMemo } from 'react';
import { route } from 'ziggy-js';

interface RelOption {
    id: number;
    member_id: number;
    label: string;
}

interface Props {
    memberOwners: MemberOwnerOption[];
    customers: RelOption[];
    companies: RelOption[];
}

export default function DomainsCreate({ memberOwners, customers, companies }: Props) {
    const m0 = memberOwners[0]?.id ?? 0;

    const { data, setData, post, processing, errors } = useForm({
        member_id: m0,
        hostname: '',
        customer_id: 0,
        company_id: 0,
        notes: '',
        ftp_accounts: [],
        emails: [],
    });

    const customersFiltered = useMemo(
        () => customers.filter((c) => c.member_id === data.member_id),
        [customers, data.member_id],
    );
    const companiesFiltered = useMemo(
        () => companies.filter((c) => c.member_id === data.member_id),
        [companies, data.member_id],
    );

    useEffect(() => {
        const cf = customersFiltered;
        const co = companiesFiltered;
        const nextCustomer = cf.some((c) => c.id === data.customer_id) ? data.customer_id : (cf[0]?.id ?? 0);
        const nextCompany = co.some((c) => c.id === data.company_id) ? data.company_id : (co[0]?.id ?? 0);
        if (nextCustomer !== data.customer_id || nextCompany !== data.company_id) {
            setData({
                ...data,
                customer_id: nextCustomer,
                company_id: nextCompany,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- allineamento IDs quando cambiano le opzioni filtrate
    }, [data.member_id, customersFiltered, companiesFiltered]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Domini', href: route('modules.web.domini.index') },
        { title: 'Nuovo' },
    ];

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('modules.web.domini.store'));
    };

    const disableSubmit = processing || customersFiltered.length === 0 || companiesFiltered.length === 0;

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title="Nuovo dominio"
            documentTitle="Nuovo dominio"
            processing={processing}
            stickyBar={
                <StickyReadFooterActions listHref={route('modules.web.domini.index')}>
                    <Button type="submit" form="domini-create-form" disabled={disableSubmit}>
                        {processing ? 'Salvataggio…' : 'Crea dominio'}
                    </Button>
                </StickyReadFooterActions>
            }
        >
            <form id="domini-create-form" onSubmit={submit} className={moduleFormSurfaceClassName()}>
                <WebDomainAnagraficaFields
                    readOnly={false}
                    data={{
                        member_id: data.member_id,
                        hostname: data.hostname,
                        customer_id: data.customer_id,
                        company_id: data.company_id,
                        notes: data.notes,
                    }}
                    setData={(key, value) => setData(key, value)}
                    errors={{
                        member_id: errors.member_id,
                        hostname: errors.hostname,
                        customer_id: errors.customer_id,
                        company_id: errors.company_id,
                        notes: errors.notes,
                    }}
                    memberOwners={memberOwners}
                    customersFiltered={customersFiltered}
                    companiesFiltered={companiesFiltered}
                />
            </form>
        </CrudModulePageLayout>
    );
}
