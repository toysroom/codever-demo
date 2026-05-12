import { FormLayout } from '@/components/custom';
import PageEntityLayout from '@/layouts/page-entity-layout';
import { moduleFormSurfaceClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type MemberOwnerOption } from '@/types';
import { useForm } from '@inertiajs/react';
import { type FormEventHandler, useEffect, useRef } from 'react';
import { route } from 'ziggy-js';
import { CustomerTabPanels, type CrmNoteRow, type CustomerTabFormData } from './customer-tab-panels';

interface CustomerPayload {
    id: number;
    member_id: number;
    member_label?: string | null;
    external_code: string | null;
    company_name: string | null;
    reference_person: string | null;
    entity_type: string | null;
    first_name: string;
    last_name: string;
    vat_number: string | null;
    fiscal_code: string | null;
    email: string;
    phone: string | null;
    mobile_phone: string | null;
    fax: string | null;
    contact_email: string | null;
    pec: string | null;
    sdi_recipient_code: string | null;
    website: string | null;
    notes: string | null;
    bank_name: string | null;
    iban: string | null;
    address: string | null;
    street: string | null;
    city: string | null;
    postal_code: string | null;
    province: string | null;
    country: string | null;
    contacts: { id: number; type: string; label: string | null; value: string }[];
    crm_notes: CrmNoteRow[];
    customer_types?: { id: number; name: string }[];
    customer_type_ids?: number[];
}

interface CustomerTypeOption {
    id: number;
    name: string;
    member_id: number;
}

interface Props {
    customer: CustomerPayload;
    memberOwners: MemberOwnerOption[];
    customerTypeOptions: CustomerTypeOption[];
}

function browserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function toFormData(c: CustomerPayload): CustomerTabFormData {
    return {
        member_id: c.member_id,
        external_code: c.external_code ?? '',
        company_name: c.company_name ?? '',
        reference_person: c.reference_person ?? '',
        entity_type: c.entity_type ?? '',
        first_name: c.first_name,
        last_name: c.last_name,
        vat_number: c.vat_number ?? '',
        fiscal_code: c.fiscal_code ?? '',
        email: c.email,
        password: '',
        password_confirmation: '',
        phone: c.phone ?? '',
        mobile_phone: c.mobile_phone ?? '',
        fax: c.fax ?? '',
        contact_email: c.contact_email ?? '',
        pec: c.pec ?? '',
        sdi_recipient_code: c.sdi_recipient_code ?? '',
        website: c.website ?? '',
        notes: c.notes ?? '',
        bank_name: c.bank_name ?? '',
        iban: c.iban ?? '',
        address: c.address ?? '',
        street: c.street ?? '',
        city: c.city ?? '',
        postal_code: c.postal_code ?? '',
        province: c.province ?? '',
        country: c.country ?? '',
        mark_email_verified: false,
        contacts: c.contacts.map((x) => ({
            type: x.type,
            label: x.label ?? '',
            value: x.value,
        })),
        new_crm_note: { body: '', reminder_at: '', timezone: browserTimezone() },
        customer_type_ids: c.customer_type_ids ?? c.customer_types?.map((t) => t.id) ?? [],
    };
}

export default function CustomersEdit({ customer, memberOwners, customerTypeOptions }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Clienti', href: route('modules.customers.index') },
        { title: 'Modifica' },
    ];

    const saveRedirectMode = useRef<'stay' | 'list'>('list');

    const { data, setData, errors, put, processing, transform } = useForm<CustomerTabFormData>(toFormData(customer));

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.member_id]);

    const submitWithRedirect = (mode: 'stay' | 'list') => {
        saveRedirectMode.current = mode;
        put(route('modules.customers.update', customer.id));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        submitWithRedirect('stay');
    };

    return (
        <PageEntityLayout
            title="Modifica cliente"
            description={
                customer.company_name?.trim()
                    ? `${customer.company_name} (${customer.first_name} ${customer.last_name})`
                    : `${customer.first_name} ${customer.last_name}`
            }
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
                    crmNotes={customer.crm_notes}
                    showPasswordFields
                    customerTypeOptions={customerTypeOptions}
                />
            </FormLayout>
        </PageEntityLayout>
    );
}
