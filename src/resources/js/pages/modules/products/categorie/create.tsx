import { FormField, MemberAccountSelect, NativeSelect, StickyReadFooterActions } from '@/components/custom';
import { ProductsModuleDataLayerBanner } from '@/components/domains/products/products-module-data-layer-banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CrudModulePageLayout from '@/layouts/crud-module-page-layout';
import { moduleFormSurfaceClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type MemberOwnerOption } from '@/types';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { route } from 'ziggy-js';

interface ParentOption {
    id: number;
    label: string;
}

interface Props {
    memberOwners: MemberOwnerOption[];
    parentOptions: ParentOption[];
    productsModuleDataLayer?: 'redis' | 'database' | null;
}

export default function CategoriesCreate({ memberOwners, parentOptions, productsModuleDataLayer }: Props) {
    const m0 = memberOwners[0]?.id ?? 0;

    const { data, setData, post, processing, errors } = useForm({
        member_id: m0,
        name: '',
        parent_id: '' as string | number,
        sort_order: 0,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Categorie', href: route('modules.products.categorie.index') },
        { title: 'Nuova' },
    ];

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('modules.products.categorie.store'));
    };

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title="Nuova categoria"
            documentTitle="Nuova categoria"
            processing={processing}
            stickyBar={
                <StickyReadFooterActions listHref={route('modules.products.categorie.index')}>
                    <Button type="submit" form="categorie-create-form" disabled={processing}>
                        {processing ? 'Salvataggio…' : 'Salva'}
                    </Button>
                </StickyReadFooterActions>
            }
        >
            <ProductsModuleDataLayerBanner layer={productsModuleDataLayer} />
            <form id="categorie-create-form" onSubmit={submit} className={moduleFormSurfaceClassName()}>
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
