import { FormField, StickyReadFooterActions } from '@/components/custom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CrudModulePageLayout from '@/layouts/crud-module-page-layout';
import { moduleFormSurfaceClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { route } from 'ziggy-js';

interface Props {
    provider: {
        id: number;
        slug: string;
        name: string;
        website_url: string | null;
    };
}

export default function HostingProvidersEdit({ provider }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        slug: provider.slug,
        name: provider.name,
        website_url: provider.website_url ?? '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Fornitori hosting', href: route('modules.web.hosting-providers.index') },
        { title: provider.name },
    ];

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(route('modules.web.hosting-providers.update', provider.id));
    };

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title="Modifica fornitore hosting"
            documentTitle={`Modifica: ${provider.name}`}
            processing={processing}
            stickyBar={
                <StickyReadFooterActions listHref={route('modules.web.hosting-providers.index')}>
                    <Button type="submit" form="hosting-provider-edit-form" disabled={processing}>
                        {processing ? 'Salvataggio…' : 'Salva'}
                    </Button>
                </StickyReadFooterActions>
            }
        >
            <form id="hosting-provider-edit-form" onSubmit={submit} className={moduleFormSurfaceClassName()}>
                <FormField id="name" label="Nome visualizzato" required error={errors.name}>
                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                </FormField>
                <FormField id="slug" label="Slug tecnico" required error={errors.slug}>
                    <Input
                        id="slug"
                        value={data.slug}
                        onChange={(e) => setData('slug', e.target.value)}
                        className="font-mono text-sm"
                        required
                    />
                </FormField>
                <FormField id="website_url" label="URL sito ufficiale (opzionale)" error={errors.website_url}>
                    <Input
                        id="website_url"
                        type="url"
                        value={data.website_url}
                        onChange={(e) => setData('website_url', e.target.value)}
                    />
                </FormField>
            </form>
        </CrudModulePageLayout>
    );
}
