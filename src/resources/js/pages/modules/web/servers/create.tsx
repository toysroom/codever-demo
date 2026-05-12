import { FormField, MemberAccountSelect, NativeSelect, StickyReadFooterActions } from '@/components/custom';
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

interface HostingProviderOption {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    memberOwners: MemberOwnerOption[];
    hostingProviders: HostingProviderOption[];
}

export default function ServersCreate({ memberOwners, hostingProviders }: Props) {
    const m0 = memberOwners[0]?.id ?? 0;
    const p0 = hostingProviders[0]?.id ?? 0;

    const { data, setData, post, processing, errors } = useForm({
        member_id: m0,
        web_hosting_provider_id: p0,
        label: '',
        host: '',
        notes: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Server', href: route('modules.web.servers.index') },
        { title: 'Nuovo' },
    ];

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('modules.web.servers.store'));
    };

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title="Nuovo server"
            documentTitle="Nuovo server"
            processing={processing}
            stickyBar={
                <StickyReadFooterActions listHref={route('modules.web.servers.index')}>
                    <Button type="submit" form="servers-create-form" disabled={processing}>
                        {processing ? 'Salvataggio…' : 'Salva'}
                    </Button>
                </StickyReadFooterActions>
            }
        >
            <form id="servers-create-form" onSubmit={submit} className={moduleFormSurfaceClassName()}>
                <MemberAccountSelect
                    options={memberOwners}
                    value={data.member_id}
                    onValueChange={(id) => setData('member_id', id)}
                    error={errors.member_id}
                />

                <FormField id="web_hosting_provider_id" label="Fornitore hosting" error={errors.web_hosting_provider_id}>
                    <NativeSelect
                        id="web_hosting_provider_id"
                        value={String(data.web_hosting_provider_id)}
                        onChange={(e) => setData('web_hosting_provider_id', Number(e.target.value))}
                    >
                        {hostingProviders.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </NativeSelect>
                </FormField>

                <FormField id="host" label="Host / IP pubblico" required error={errors.host}>
                    <Input
                        id="host"
                        value={data.host}
                        placeholder="46.30.245.111"
                        onChange={(e) => setData('host', e.target.value)}
                        className="font-mono text-sm"
                        required
                    />
                </FormField>

                <FormField id="label" label="Etichetta interna (opzionale)" error={errors.label}>
                    <Input id="label" value={data.label} onChange={(e) => setData('label', e.target.value)} />
                </FormField>

                <FormField id="notes" label="Note" error={errors.notes}>
                    <Textarea id="notes" rows={4} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                </FormField>
            </form>
        </CrudModulePageLayout>
    );
}
