import { FormField, MemberAccountSelect, NativeSelect, StickyFormFooterActions } from '@/components/custom';
import { ProductsModuleDataLayerBanner } from '@/components/domains/products/products-module-data-layer-banner';
import { Input } from '@/components/ui/input';
import CrudModulePageLayout from '@/layouts/crud-module-page-layout';
import { moduleFormSurfaceClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type MemberOwnerOption } from '@/types';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useEffect, useRef } from 'react';
import { route } from 'ziggy-js';

interface ParentOption {
    id: number;
    label: string;
}

interface CategoryEdit {
    id: number;
    member_id: number;
    parent_id: number | null;
    name: string;
    sort_order: number;
}

interface Props {
    category: CategoryEdit;
    memberOwners: MemberOwnerOption[];
    parentOptions: ParentOption[];
    productsModuleDataLayer?: 'redis' | 'database' | null;
}

export default function CategoriesEdit({ category, memberOwners, parentOptions, productsModuleDataLayer }: Props) {
    const saveRedirectMode = useRef<'stay' | 'list'>('list');

    const { data, setData, put, processing, errors, transform } = useForm({
        member_id: category.member_id,
        name: category.name,
        parent_id: (category.parent_id ?? '') as number | '',
        sort_order: category.sort_order,
    });

    useEffect(() => {
        transform((payload) => ({
            ...payload,
            save_redirect: saveRedirectMode.current,
        }));
    }, [transform]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Categorie', href: route('modules.products.categorie.index') },
        { title: 'Modifica' },
    ];

    const submitWithRedirect = (mode: 'stay' | 'list') => {
        saveRedirectMode.current = mode;
        put(route('modules.products.categorie.update', category.id));
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        submitWithRedirect('stay');
    };

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title="Modifica categoria"
            documentTitle="Modifica categoria"
            processing={processing}
            stickyBar={
                <StickyFormFooterActions
                    listHref={route('modules.products.categorie.index')}
                    disabled={processing}
                    onSaveStay={() => submitWithRedirect('stay')}
                    onSaveList={() => submitWithRedirect('list')}
                />
            }
        >
            <ProductsModuleDataLayerBanner layer={productsModuleDataLayer} />
            <form id="categorie-edit-form" onSubmit={submit} className={moduleFormSurfaceClassName()}>
                <MemberAccountSelect
                    options={memberOwners}
                    value={data.member_id}
                    onValueChange={(id) => setData('member_id', id)}
                    error={errors.member_id}
                />

                <FormField id="name" label="Nome" required error={errors.name}>
                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                </FormField>

                <FormField id="parent_id" label="Categoria padre (opzionale)" error={errors.parent_id}>
                    <NativeSelect
                        id="parent_id"
                        value={data.parent_id === '' ? '' : String(data.parent_id)}
                        onChange={(e) =>
                            setData('parent_id', e.target.value === '' ? '' : Number(e.target.value))
                        }
                    >
                        <option value="">— Nessuna —</option>
                        {parentOptions.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.label}
                            </option>
                        ))}
                    </NativeSelect>
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
