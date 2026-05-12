import { FormField, MemberAccountSelect, NativeSelect, StickyFormFooterActions } from '@/components/custom';
import { ProductsModuleDataLayerBanner } from '@/components/domains/products/products-module-data-layer-banner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CrudModulePageLayout from '@/layouts/crud-module-page-layout';
import { moduleFormSurfaceClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type MemberOwnerOption } from '@/types';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useEffect, useRef } from 'react';
import { route } from 'ziggy-js';

interface PriceListEdit {
    id: number;
    member_id: number;
    name: string;
    code: string | null;
    currency: string;
    valid_from: string | null;
    valid_to: string | null;
    is_default: boolean;
    notes: string | null;
}

interface Props {
    priceList: PriceListEdit;
    memberOwners: MemberOwnerOption[];
    productsModuleDataLayer?: 'redis' | 'database' | null;
}

export default function PriceListsEdit({ priceList, memberOwners, productsModuleDataLayer }: Props) {
    const saveRedirectMode = useRef<'stay' | 'list'>('list');

    const { data, setData, put, processing, errors, transform } = useForm({
        member_id: priceList.member_id,
        name: priceList.name,
        code: priceList.code ?? '',
        currency: priceList.currency,
        valid_from: priceList.valid_from ?? '',
        valid_to: priceList.valid_to ?? '',
        is_default: priceList.is_default,
        notes: priceList.notes ?? '',
    });

    useEffect(() => {
        transform((payload) => ({
            ...payload,
            save_redirect: saveRedirectMode.current,
        }));
    }, [transform]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Listini', href: route('modules.products.listini.index') },
        { title: 'Modifica' },
    ];

    const submitWithRedirect = (mode: 'stay' | 'list') => {
        saveRedirectMode.current = mode;
        put(route('modules.products.listini.update', priceList.id));
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        submitWithRedirect('stay');
    };

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title="Modifica listino"
            documentTitle="Modifica listino"
            processing={processing}
            stickyBar={
                <StickyFormFooterActions
                    listHref={route('modules.products.listini.index')}
                    disabled={processing}
                    onSaveStay={() => submitWithRedirect('stay')}
                    onSaveList={() => submitWithRedirect('list')}
                />
            }
        >
            <ProductsModuleDataLayerBanner layer={productsModuleDataLayer} />
            <form id="listini-edit-form" onSubmit={submit} className={moduleFormSurfaceClassName()}>
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
