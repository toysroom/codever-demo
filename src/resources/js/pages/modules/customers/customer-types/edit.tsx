import { FormField, StickyFormFooterActions } from '@/components/custom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CrudModulePageLayout from '@/layouts/crud-module-page-layout';
import { moduleFormSurfaceClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useEffect, useRef } from 'react';
import { route } from 'ziggy-js';

interface CustomerTypeEdit {
    id: number;
    member_label: string | null;
    name: string;
    description: string | null;
    sort_order: number;
}

interface Props {
    customerType: CustomerTypeEdit;
}

export default function CustomerTypesEdit({ customerType }: Props) {
    const saveRedirectMode = useRef<'stay' | 'list'>('list');

    const { data, setData, put, processing, errors, transform } = useForm({
        name: customerType.name,
        description: customerType.description ?? '',
        sort_order: customerType.sort_order,
    });

    useEffect(() => {
        transform((payload) => ({
            ...payload,
            save_redirect: saveRedirectMode.current,
        }));
    }, [transform]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Tipi cliente', href: route('modules.customers.customer-types.index') },
        { title: 'Modifica' },
    ];

    const submitWithRedirect = (mode: 'stay' | 'list') => {
        saveRedirectMode.current = mode;
        put(route('modules.customers.customer-types.update', customerType.id));
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        submitWithRedirect('stay');
    };

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title="Modifica tipo cliente"
            documentTitle="Modifica tipo cliente"
            processing={processing}
            stickyBar={
                <StickyFormFooterActions
                    listHref={route('modules.customers.customer-types.index')}
                    disabled={processing}
                    onSaveStay={() => submitWithRedirect('stay')}
                    onSaveList={() => submitWithRedirect('list')}
                />
            }
        >
            <form id="customer-types-edit-form" onSubmit={submit} className={moduleFormSurfaceClassName()}>
                {customerType.member_label ? (
                    <div className="grid gap-2">
                        <Label>Account</Label>
                        <p className="text-muted-foreground text-sm">{customerType.member_label}</p>
                    </div>
                ) : null}
                <FormField id="name" label="Nome" required error={errors.name}>
                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                </FormField>
                <FormField id="description" label="Descrizione (opzionale)" error={errors.description}>
                    <Textarea
                        id="description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        rows={3}
                    />
                </FormField>
                <FormField id="sort_order" label="Ordine" error={errors.sort_order}>
                    <Input
                        id="sort_order"
                        type="number"
                        min={0}
                        value={data.sort_order}
                        onChange={(e) => setData('sort_order', Number(e.target.value))}
                    />
                </FormField>
            </form>
        </CrudModulePageLayout>
    );
}
