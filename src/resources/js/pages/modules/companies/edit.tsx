import { FormField, MemberAccountSelect, StickyFormFooterActions } from '@/components/custom';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CrudModulePageLayout from '@/layouts/crud-module-page-layout';
import { moduleFormSurfaceClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type MemberOwnerOption } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useEffect, useRef } from 'react';
import { route } from 'ziggy-js';

interface CompanyEdit {
    id: number;
    member_id: number;
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
    company: CompanyEdit;
    memberOwners: MemberOwnerOption[];
}

export default function CompaniesEdit({ company, memberOwners }: Props) {
    const saveRedirectMode = useRef<'stay' | 'list'>('list');

    const { data, setData, put, processing, errors, transform } = useForm({
        member_id: company.member_id,
        name: company.name,
        legal_name: company.legal_name ?? '',
        vat_number: company.vat_number ?? '',
        email: company.email ?? '',
        phone: company.phone ?? '',
        pec: company.pec ?? '',
        sdi_recipient_code: company.sdi_recipient_code ?? '',
        address: company.address ?? '',
        city: company.city ?? '',
        postal_code: company.postal_code ?? '',
        province: company.province ?? '',
        country: company.country ?? 'IT',
        notes: company.notes ?? '',
        is_default: company.is_default,
    });

    useEffect(() => {
        transform((payload) => ({
            ...payload,
            save_redirect: saveRedirectMode.current,
        }));
    }, [transform]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Aziende', href: route('modules.companies.index') },
        { title: `Modifica: ${company.name}` },
    ];

    const submitWithRedirect = (mode: 'stay' | 'list') => {
        saveRedirectMode.current = mode;
        put(route('modules.companies.update', company.id));
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        submitWithRedirect('stay');
    };

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title="Modifica azienda"
            documentTitle={`Modifica ${company.name}`}
            processing={processing}
            headerActions={
                <Button variant="outline" asChild>
                    <Link href={route('modules.companies.show', company.id)}>Scheda</Link>
                </Button>
            }
            stickyBar={
                <StickyFormFooterActions
                    listHref={route('modules.companies.index')}
                    disabled={processing}
                    onSaveStay={() => submitWithRedirect('stay')}
                    onSaveList={() => submitWithRedirect('list')}
                />
            }
        >
            <form id="companies-edit-form" onSubmit={submit} className={moduleFormSurfaceClassName()}>
                <MemberAccountSelect
                    options={memberOwners}
                    value={data.member_id}
                    onValueChange={(id) => setData('member_id', id)}
                    error={errors.member_id}
                />

                <FormField id="name" label="Nome breve" required error={errors.name}>
                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                </FormField>

                <FormField id="legal_name" label="Ragione sociale" error={errors.legal_name}>
                    <Input id="legal_name" value={data.legal_name} onChange={(e) => setData('legal_name', e.target.value)} />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField id="vat_number" label="Partita IVA" error={errors.vat_number}>
                        <Input id="vat_number" value={data.vat_number} onChange={(e) => setData('vat_number', e.target.value)} />
                    </FormField>
                    <FormField id="sdi_recipient_code" label="Codice destinatario (SDI)" error={errors.sdi_recipient_code}>
                        <Input
                            id="sdi_recipient_code"
                            value={data.sdi_recipient_code}
                            onChange={(e) => setData('sdi_recipient_code', e.target.value)}
                        />
                    </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField id="email" label="Email" error={errors.email}>
                        <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                    </FormField>
                    <FormField id="pec" label="PEC" error={errors.pec}>
                        <Input id="pec" type="email" value={data.pec} onChange={(e) => setData('pec', e.target.value)} />
                    </FormField>
                </div>

                <FormField id="phone" label="Telefono" error={errors.phone}>
                    <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                </FormField>

                <FormField id="address" label="Indirizzo" error={errors.address}>
                    <Textarea id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} rows={2} />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-3">
                    <FormField id="city" label="Città" error={errors.city}>
                        <Input id="city" value={data.city} onChange={(e) => setData('city', e.target.value)} />
                    </FormField>
                    <FormField id="postal_code" label="CAP" error={errors.postal_code}>
                        <Input id="postal_code" value={data.postal_code} onChange={(e) => setData('postal_code', e.target.value)} />
                    </FormField>
                    <FormField id="province" label="Provincia" error={errors.province}>
                        <Input id="province" value={data.province} onChange={(e) => setData('province', e.target.value)} />
                    </FormField>
                </div>

                <FormField id="country" label="Paese (codice ISO)" error={errors.country}>
                    <Input id="country" value={data.country} onChange={(e) => setData('country', e.target.value)} maxLength={2} />
                </FormField>

                <FormField id="notes" label="Note" error={errors.notes}>
                    <Textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={3} />
                </FormField>

                <div className="flex items-center gap-2">
                    <input
                        id="is_default"
                        type="checkbox"
                        checked={data.is_default}
                        onChange={(e) => setData('is_default', e.target.checked)}
                        className="size-4 rounded border"
                    />
                    <Label htmlFor="is_default" className="font-normal">
                        Azienda predefinita per l&apos;account
                    </Label>
                </div>
                <InputError message={errors.is_default} />

                <p className="text-muted-foreground text-xs">Domini Web collegati: {company.web_domains_count}</p>
            </form>
        </CrudModulePageLayout>
    );
}
