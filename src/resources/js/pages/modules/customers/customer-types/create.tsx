import { FormField, MemberAccountSelect, StickyReadFooterActions } from '@/components/custom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function CustomerTypesCreate({ memberOwners }: Props) {
    const m0 = memberOwners[0]?.id ?? 0;

    const { data, setData, post, processing, errors } = useForm({
        member_id: m0,
        name: '',
        description: '',
        sort_order: 0,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Tipi cliente', href: route('modules.customers.customer-types.index') },
        { title: 'Nuovo' },
    ];

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('modules.customers.customer-types.store'));
    };

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title="Nuovo tipo cliente"
            documentTitle="Nuovo tipo cliente"
            processing={processing}
            stickyBar={
                <StickyReadFooterActions listHref={route('modules.customers.customer-types.index')}>
                    <Button type="submit" form="customer-types-create-form" disabled={processing}>
                        {processing ? 'Salvataggio…' : 'Salva'}
                    </Button>
                </StickyReadFooterActions>
            }
        >
            <form id="customer-types-create-form" onSubmit={submit} className={moduleFormSurfaceClassName()}>
                <MemberAccountSelect
                    options={memberOwners}
                    value={data.member_id}
                    onValueChange={(id) => setData('member_id', id)}
                    error={errors.member_id}
                />

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
