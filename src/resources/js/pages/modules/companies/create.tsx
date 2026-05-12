import { FormField, MemberAccountSelect, StickyReadFooterActions } from '@/components/custom';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CrudModulePageLayout from '@/layouts/crud-module-page-layout';
import { moduleFormSurfaceClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type MemberOwnerOption } from '@/types';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { route } from 'ziggy-js';

interface Props {
    memberOwners: MemberOwnerOption[];
}

export default function CompaniesCreate({ memberOwners }: Props) {
    const m0 = memberOwners[0]?.id ?? 0;

    const { data, setData, post, processing, errors } = useForm({
        member_id: m0,
        name: '',
        legal_name: '',
        vat_number: '',
        email: '',
        phone: '',
        pec: '',
        sdi_recipient_code: '',
        address: '',
        city: '',
        postal_code: '',
        province: '',
        country: 'IT',
        notes: '',
        is_default: false,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Aziende', href: route('modules.companies.index') },
        { title: 'Nuova' },
    ];

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('modules.companies.store'));
    };

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title="Nuova azienda"
            documentTitle="Nuova azienda"
            processing={processing}
            stickyBar={
                <StickyReadFooterActions listHref={route('modules.companies.index')}>
                    <Button type="submit" form="companies-create-form" disabled={processing}>
                        Salva
                    </Button>
                </StickyReadFooterActions>
            }
        >
            <form id="companies-create-form" onSubmit={submit} className={moduleFormSurfaceClassName()}>
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
                        Azienda predefinita per l&apos;account (ne esiste una sola per volta)
                    </Label>
                </div>
                <InputError message={errors.is_default} />
            </form>
        </CrudModulePageLayout>
    );
}
