import { FormLayout } from '@/components/custom';
import PageEntityLayout from '@/layouts/page-entity-layout';
import { moduleFormSurfaceClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type MemberOwnerOption } from '@/types';
import { useForm } from '@inertiajs/react';
import { type FormEventHandler, useEffect, useRef } from 'react';
import { route } from 'ziggy-js';
import { CustomerTabPanels, type CustomerTabFormData } from './customer-tab-panels';

interface CustomerTypeOption {
    id: number;
    name: string;
    member_id: number;
}

interface Props {
    memberOwners: MemberOwnerOption[];
    customerTypeOptions: CustomerTypeOption[];
}

function browserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function emptyForm(firstMemberId: number): CustomerTabFormData {
    return {
        member_id: firstMemberId,
        external_code: '',
        company_name: '',
        reference_person: '',
        entity_type: '',
        first_name: '',
        last_name: '',
        vat_number: '',
        fiscal_code: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        mobile_phone: '',
        fax: '',
        contact_email: '',
        pec: '',
        sdi_recipient_code: '',
        website: '',
        notes: '',
        bank_name: '',
        iban: '',
        address: '',
        street: '',
        city: '',
        postal_code: '',
        province: '',
        country: '',
        mark_email_verified: false,
        contacts: [],
        new_crm_note: { body: '', reminder_at: '', timezone: browserTimezone() },
        customer_type_ids: [],
    };
}

export default function CustomersCreate({ memberOwners, customerTypeOptions }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Clienti', href: route('modules.customers.index') },
        { title: 'Nuovo' },
    ];

    const firstId = memberOwners[0]?.id ?? 0;
    const saveRedirectMode = useRef<'stay' | 'list'>('list');

    const { data, setData, errors, post, processing, transform } = useForm<CustomerTabFormData>(emptyForm(firstId));

    useEffect(() => {
        transform((payload) => ({
            ...payload,
            save_redirect: saveRedirectMode.current,
        }));
    }, [transform]);

    useEffect(() => {
        setData(
            'customer_type_ids',
            data.customer_type_ids.filter((id) =>
                customerTypeOptions.some((o) => o.id === id && o.member_id === data.member_id),
            ),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps -- solo quando cambia l'account
    }, [data.member_id]);

    const submitWithRedirect = (mode: 'stay' | 'list') => {
        saveRedirectMode.current = mode;
        post(route('modules.customers.store'));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        submitWithRedirect('stay');
    };

    return (
        <PageEntityLayout
            title="Nuovo cliente"
            description="Compila le schede e salva. Il promemoria CRM usa le code Laravel."
            breadcrumbs={breadcrumbs}
            footerMode="form"
            listHref={route('modules.customers.index')}
            listLabel="Torna alla lista"
            processing={processing}
            loadingMessage="Operazione in corso…"
            saveStayLabel="Salva"
            saveListLabel="Salva e torna alla lista"
            onSaveStay={() => submitWithRedirect('stay')}
            onSaveList={() => submitWithRedirect('list')}
        >
            <FormLayout onSubmit={submit} className={moduleFormSurfaceClassName()}>
                <CustomerTabPanels
                    readOnly={false}
                    memberOwners={memberOwners}
                    data={data}
                    setData={setData}
                    errors={errors}
                    crmNotes={[]}
                    showPasswordFields
                    customerTypeOptions={customerTypeOptions}
                />
            </FormLayout>
        </PageEntityLayout>
    );
}
