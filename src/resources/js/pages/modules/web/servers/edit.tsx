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
    server: {
        id: number;
        member_id: number;
        web_hosting_provider_id: number;
        label: string | null;
        host: string;
        notes: string | null;
    };
    memberOwners: MemberOwnerOption[];
    hostingProviders: HostingProviderOption[];
}

export default function ServersEdit({ server, memberOwners, hostingProviders }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        member_id: server.member_id,
        web_hosting_provider_id: server.web_hosting_provider_id,
        label: server.label ?? '',
        host: server.host,
        notes: server.notes ?? '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Server', href: route('modules.web.servers.index') },
        { title: server.host },
    ];

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(route('modules.web.servers.update', server.id));
    };

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title="Modifica server"
            documentTitle={`Modifica: ${server.host}`}
            processing={processing}
            stickyBar={
                <StickyReadFooterActions listHref={route('modules.web.servers.index')}>
                    <Button type="submit" form="servers-edit-form" disabled={processing}>
                        {processing ? 'Salvataggio…' : 'Salva'}
                    </Button>
                </StickyReadFooterActions>
            }
        >
            <form id="servers-edit-form" onSubmit={submit} className={moduleFormSurfaceClassName()}>
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
