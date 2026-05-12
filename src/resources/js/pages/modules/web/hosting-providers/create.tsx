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

export default function HostingProvidersCreate() {
    const { data, setData, post, processing, errors } = useForm({
        slug: '',
        name: '',
        website_url: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Fornitori hosting', href: route('modules.web.hosting-providers.index') },
        { title: 'Nuovo' },
    ];

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('modules.web.hosting-providers.store'));
    };

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title="Nuovo fornitore hosting"
            documentTitle="Nuovo fornitore hosting"
            processing={processing}
            stickyBar={
                <StickyReadFooterActions listHref={route('modules.web.hosting-providers.index')}>
                    <Button type="submit" form="hosting-provider-create-form" disabled={processing}>
                        {processing ? 'Salvataggio…' : 'Salva'}
                    </Button>
                </StickyReadFooterActions>
            }
        >
            <form id="hosting-provider-create-form" onSubmit={submit} className={moduleFormSurfaceClassName()}>
                <FormField id="name" label="Nome visualizzato" required error={errors.name}>
                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                </FormField>

                <FormField
                    id="slug"
                    label={
                        <>
                            Slug tecnico{' '}
                            <span className="text-muted-foreground font-normal">(auto dal nome se vuoto)</span>
                        </>
                    }
                    error={errors.slug}
                >
                    <Input
                        id="slug"
                        value={data.slug}
                        placeholder="es. serverplan"
                        onChange={(e) => setData('slug', e.target.value)}
                        className="font-mono text-sm"
                    />
                </FormField>

                <FormField id="website_url" label="URL sito ufficiale (opzionale)" error={errors.website_url}>
                    <Input
                        id="website_url"
                        type="url"
                        value={data.website_url}
                        placeholder="https://..."
                        onChange={(e) => setData('website_url', e.target.value)}
                    />
                </FormField>
            </form>
        </CrudModulePageLayout>
    );
}
