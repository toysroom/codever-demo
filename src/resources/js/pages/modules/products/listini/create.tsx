import { FormField, MemberAccountSelect, NativeSelect, StickyReadFooterActions } from '@/components/custom';
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

export default function PriceListsCreate({ memberOwners }: Props) {
    const m0 = memberOwners[0]?.id ?? 0;

    const { data, setData, post, processing, errors } = useForm({
        member_id: m0,
        name: '',
        code: '',
        currency: 'EUR',
        valid_from: '',
        valid_to: '',
        is_default: false,
        notes: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Listini', href: route('modules.products.listini.index') },
        { title: 'Nuovo' },
    ];

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('modules.products.listini.store'));
    };

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title="Nuovo listino"
            documentTitle="Nuovo listino"
            processing={processing}
            stickyBar={
                <StickyReadFooterActions listHref={route('modules.products.listini.index')}>
                    <Button type="submit" form="listini-create-form" disabled={processing}>
                        {processing ? 'Salvataggio…' : 'Salva'}
                    </Button>
                </StickyReadFooterActions>
            }
        >
            <form id="listini-create-form" onSubmit={submit} className={moduleFormSurfaceClassName()}>
                <MemberAccountSelect
                    options={memberOwners}
                    value={data.member_id}
                    onValueChange={(id) => setData('member_id', id)}
                    error={errors.member_id}
                />

                <FormField id="name" label="Nome" required error={errors.name}>
                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                </FormField>

                <FormField id="code" label="Codice (opzionale)" error={errors.code}>
                    <Input id="code" value={data.code} onChange={(e) => setData('code', e.target.value)} />
                </FormField>

                <FormField id="currency" label="Valuta" error={errors.currency}>
                    <NativeSelect id="currency" value={data.currency} onChange={(e) => setData('currency', e.target.value)}>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                    </NativeSelect>
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField id="valid_from" label="Valido dal" error={errors.valid_from}>
                        <Input
                            id="valid_from"
                            type="date"
                            value={data.valid_from}
                            onChange={(e) => setData('valid_from', e.target.value)}
                        />
                    </FormField>
                    <FormField id="valid_to" label="Valido al" error={errors.valid_to}>
                        <Input
                            id="valid_to"
                            type="date"
                            value={data.valid_to}
                            onChange={(e) => setData('valid_to', e.target.value)}
                        />
                    </FormField>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        id="is_default"
                        type="checkbox"
                        checked={data.is_default}
                        onChange={(e) => setData('is_default', e.target.checked)}
                        className="size-4 rounded border"
                    />
                    <Label htmlFor="is_default" className="font-normal">
                        Listino predefinito
                    </Label>
                </div>

                <FormField id="notes" label="Note" error={errors.notes}>
                    <Textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={3} />
                </FormField>
            </form>
        </CrudModulePageLayout>
    );
}
