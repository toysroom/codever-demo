import { EditButton } from '@/components/custom';
import PageEntityLayout from '@/layouts/page-entity-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
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
}

interface Props {
    customer: CustomerPayload;
}

export default function CustomersShow({ customer }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Clienti', href: route('modules.customers.index') },
        { title: 'Dettaglio' },
    ];

    const data: CustomerTabFormData = {
        member_id: customer.member_id,
        external_code: customer.external_code ?? '',
        company_name: customer.company_name ?? '',
        reference_person: customer.reference_person ?? '',
        entity_type: customer.entity_type ?? '',
        first_name: customer.first_name,
        last_name: customer.last_name,
        vat_number: customer.vat_number ?? '',
        fiscal_code: customer.fiscal_code ?? '',
        email: customer.email,
        password: '',
        password_confirmation: '',
        phone: customer.phone ?? '',
        mobile_phone: customer.mobile_phone ?? '',
        fax: customer.fax ?? '',
        contact_email: customer.contact_email ?? '',
        pec: customer.pec ?? '',
        sdi_recipient_code: customer.sdi_recipient_code ?? '',
        website: customer.website ?? '',
        notes: customer.notes ?? '',
        bank_name: customer.bank_name ?? '',
        iban: customer.iban ?? '',
        address: customer.address ?? '',
        street: customer.street ?? '',
        city: customer.city ?? '',
        postal_code: customer.postal_code ?? '',
        province: customer.province ?? '',
        country: customer.country ?? '',
        mark_email_verified: false,
        contacts: customer.contacts.map((x) => ({
            type: x.type,
            label: x.label ?? '',
            value: x.value,
        })),
        new_crm_note: { body: '', reminder_at: '', timezone: 'UTC' },
        customer_type_ids: [],
    };

    const titlePrimary = customer.company_name?.trim()
        ? customer.company_name
        : `${customer.first_name} ${customer.last_name}`;
    const titleSecondary =
        customer.company_name?.trim() ? `${customer.first_name} ${customer.last_name}` : null;

    return (
        <PageEntityLayout
            title={titlePrimary}
            description={titleSecondary ? `Referente / login: ${titleSecondary}` : 'Scheda cliente (sola lettura)'}
            breadcrumbs={breadcrumbs}
            footerMode="readonly"
            listHref={route('modules.customers.index')}
            listLabel="Torna alla lista"
            readonlyTrailing={<EditButton href={route('modules.customers.edit', customer.id)} />}
        >
            <CustomerTabPanels
                readOnly
                memberOwners={[]}
                data={data}
                errors={{}}
                crmNotes={customer.crm_notes}
                showPasswordFields={false}
                memberLabel={customer.member_label ?? null}
                assignedCustomerTypes={customer.customer_types ?? []}
            />
        </PageEntityLayout>
    );
}
