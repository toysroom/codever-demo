import { FormField, FormLayout, NativeSelect } from '@/components/custom';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import PageEntityLayout from '@/layouts/page-entity-layout';
import { moduleFormSurfaceClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { useForm } from '@inertiajs/react';
import { type FormEventHandler, useEffect, useRef } from 'react';
import { route } from 'ziggy-js';

interface LicensePlanOption {
    id: number;
    name: string;
    slug: string;
}

interface AccountPayload {
    id: number;
    company_name: string | null;
    company_vat: string | null;
    license_plan_id: number | null;
    max_customers: number | null;
    max_sub_members: number | null;
    subscription_status: string | null;
}

interface OwnerPayload {
    name: string;
    email: string;
}

interface Props {
    account: AccountPayload;
    owner: OwnerPayload;
    licensePlans: LicensePlanOption[];
}

export default function AccountsEdit({ account, owner, licensePlans }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Account', href: route('accounts.index') },
        { title: 'Modifica' },
    ];

    const saveRedirectMode = useRef<'stay' | 'list'>('list');

    const { data, setData, put, processing, errors, transform } = useForm({
        company_name: account.company_name ?? '',
        company_vat: account.company_vat ?? '',
        owner_name: owner.name,
        email: owner.email,
        password: '',
        password_confirmation: '',
        license_plan_id: account.license_plan_id ?? ('' as number | ''),
        max_customers: account.max_customers ?? ('' as number | ''),
        max_sub_members: account.max_sub_members ?? ('' as number | ''),
        subscription_status: account.subscription_status ?? 'active',
    });

    useEffect(() => {
        transform((payload) => {
            const { password, password_confirmation, ...rest } = payload;
            return {
                ...rest,
                license_plan_id: payload.license_plan_id === '' ? null : payload.license_plan_id,
                max_customers: payload.max_customers === '' ? null : payload.max_customers,
                max_sub_members: payload.max_sub_members === '' ? null : payload.max_sub_members,
                save_redirect: saveRedirectMode.current,
                ...(password !== '' ? { password, password_confirmation } : {}),
            };
        });
    }, [transform]);

    const submitWithRedirect = (mode: 'stay' | 'list') => {
        saveRedirectMode.current = mode;
        put(route('accounts.update', account.id));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        submitWithRedirect('stay');
    };

    return (
        <PageEntityLayout
            title="Modifica account"
            description={account.company_name ?? `Account #${account.id}`}
            breadcrumbs={breadcrumbs}
            footerMode="form"
            listHref={route('accounts.index')}
            listLabel="Torna alla lista"
            processing={processing}
            loadingMessage="Salvataggio…"
            saveStayLabel="Salva"
            saveListLabel="Salva e torna alla lista"
            onSaveStay={() => submitWithRedirect('stay')}
            onSaveList={() => submitWithRedirect('list')}
        >
            <FormLayout onSubmit={submit} className={moduleFormSurfaceClassName()}>
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField id="company_name" label="Ragione sociale" required error={errors.company_name} className="sm:col-span-2">
                        <Input
                            id="company_name"
                            value={data.company_name}
                            onChange={(e) => setData('company_name', e.target.value)}
                            required
                        />
                    </FormField>
                    <FormField id="company_vat" label="P.IVA" error={errors.company_vat}>
                        <Input id="company_vat" value={data.company_vat} onChange={(e) => setData('company_vat', e.target.value)} />
                    </FormField>
                    <FormField id="license_plan_id" label="Piano licenza" error={errors.license_plan_id}>
                        <NativeSelect
                            id="license_plan_id"
                            value={data.license_plan_id === '' ? '' : String(data.license_plan_id)}
                            onChange={(e) =>
                                setData('license_plan_id', e.target.value === '' ? '' : Number(e.target.value))
                            }
                        >
                            <option value="">— Nessuno —</option>
                            {licensePlans.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </NativeSelect>
                    </FormField>
                    <FormField id="subscription_status" label="Stato subscription" error={errors.subscription_status}>
                        <NativeSelect
                            id="subscription_status"
                            value={data.subscription_status}
                            onChange={(e) => setData('subscription_status', e.target.value)}
                        >
                            <option value="active">active</option>
                            <option value="trial">trial</option>
                            <option value="cancelled">cancelled</option>
                            <option value="past_due">past_due</option>
                        </NativeSelect>
                    </FormField>
                    <FormField id="max_customers" label="Max clienti" error={errors.max_customers}>
                        <Input
                            id="max_customers"
                            type="number"
                            min={0}
                            value={data.max_customers === '' ? '' : data.max_customers}
                            onChange={(e) =>
                                setData('max_customers', e.target.value === '' ? '' : Number(e.target.value))
                            }
                        />
                    </FormField>
                    <FormField id="max_sub_members" label="Max sub-member" error={errors.max_sub_members}>
                        <Input
                            id="max_sub_members"
                            type="number"
                            min={0}
                            value={data.max_sub_members === '' ? '' : data.max_sub_members}
                            onChange={(e) =>
                                setData('max_sub_members', e.target.value === '' ? '' : Number(e.target.value))
                            }
                        />
                    </FormField>
                </div>
                <div className="mt-6 border-t pt-6">
                    <p className="mb-4 text-sm font-medium">Utente owner</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField id="owner_name" label="Nome visualizzato" required error={errors.owner_name} className="sm:col-span-2">
                            <Input
                                id="owner_name"
                                value={data.owner_name}
                                onChange={(e) => setData('owner_name', e.target.value)}
                                required
                            />
                        </FormField>
                        <FormField id="email" label="Email login" required error={errors.email} className="sm:col-span-2">
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                        </FormField>
                        <FormField id="password" label="Nuova password (opzionale)" error={errors.password}>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="new-password"
                            />
                        </FormField>
                        <FormField id="password_confirmation" label="Conferma password" error={errors.password_confirmation}>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                autoComplete="new-password"
                            />
                        </FormField>
                    </div>
                </div>
                <InputError message={(errors as Record<string, string | undefined>).account} />
            </FormLayout>
        </PageEntityLayout>
    );
}
