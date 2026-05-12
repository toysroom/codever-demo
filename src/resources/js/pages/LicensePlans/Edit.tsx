import { FormField, FormLayout, NativeSelect } from '@/components/custom';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PageEntityLayout from '@/layouts/page-entity-layout';
import { moduleFormSurfaceClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { useForm } from '@inertiajs/react';
import { type FormEventHandler, useEffect, useRef } from 'react';
import { route } from 'ziggy-js';

interface PlanPayload {
    id: number;
    name: string;
    slug: string;
    package_tier: string | null;
    description: string | null;
    price: string | number | null;
    billing_period: string | null;
    annual_term_months: number;
    trial_days: number;
    max_customers: number | null;
    max_sub_members: number | null;
    features_json: string;
    is_active: boolean;
    sort_order: number;
}

interface Props {
    plan: PlanPayload;
}

export default function LicensePlansEdit({ plan }: Props) {
    const redirectToIndexAfterSave = useRef(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Piani licenza', href: route('license-plans.index') },
        { title: plan.name, href: route('license-plans.show', plan.id) },
        { title: 'Modifica' },
    ];

    const { data, setData, put, processing, errors, transform } = useForm({
        name: plan.name,
        slug: plan.slug,
        package_tier: (plan.package_tier ?? '') as '' | 'basic' | 'premium' | 'enterprise',
        description: plan.description ?? '',
        price: plan.price === null || plan.price === '' ? ('' as number | '') : Number(plan.price),
        billing_period: (plan.billing_period ?? '') as '' | 'monthly' | 'yearly',
        annual_term_months: plan.annual_term_months ?? 12,
        trial_days: plan.trial_days,
        max_customers: plan.max_customers ?? ('' as number | ''),
        max_sub_members: plan.max_sub_members ?? ('' as number | ''),
        features_json: plan.features_json,
        is_active: plan.is_active,
        sort_order: plan.sort_order,
    });

    useEffect(() => {
        transform((payload) => ({
            ...payload,
            description: payload.description === '' ? null : payload.description,
            package_tier: payload.package_tier === '' ? null : payload.package_tier,
            price: payload.price === '' ? null : payload.price,
            billing_period: payload.billing_period === '' ? null : payload.billing_period,
            max_customers: payload.max_customers === '' ? null : payload.max_customers,
            max_sub_members: payload.max_sub_members === '' ? null : payload.max_sub_members,
            features_json: payload.features_json.trim() === '' ? null : payload.features_json,
            redirect_to_index: redirectToIndexAfterSave.current,
        }));
    }, [transform]);

    const runPut = () => {
        put(route('license-plans.update', plan.id));
    };

    const submitToDetail: FormEventHandler = (e) => {
        e.preventDefault();
        redirectToIndexAfterSave.current = false;
        runPut();
    };

    const saveStay = () => {
        redirectToIndexAfterSave.current = false;
        runPut();
    };

    const saveList = () => {
        redirectToIndexAfterSave.current = true;
        runPut();
    };

    return (
        <PageEntityLayout
            title="Modifica piano licenza"
            description={plan.name}
            breadcrumbs={breadcrumbs}
            footerMode="form"
            listHref={route('license-plans.index')}
            listLabel="Torna alla lista"
            processing={processing}
            loadingMessage="Salvataggio…"
            saveStayLabel="Salva"
            saveListLabel="Salva e torna alla lista"
            onSaveStay={saveStay}
            onSaveList={saveList}
        >
            <FormLayout onSubmit={submitToDetail} className={moduleFormSurfaceClassName()}>
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField id="name" label="Nome" required error={errors.name}>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                    </FormField>
                    <FormField id="package_tier" label="Pacchetto commerciale" error={errors.package_tier}>
                        <NativeSelect
                            id="package_tier"
                            value={data.package_tier}
                            onChange={(e) =>
                                setData('package_tier', e.target.value as '' | 'basic' | 'premium' | 'enterprise')
                            }
                        >
                            <option value="">Nessuno (es. Free)</option>
                            <option value="basic">Basic</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                        </NativeSelect>
                    </FormField>
                    <FormField id="slug" label="Slug" required error={errors.slug}>
                        <Input
                            id="slug"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                            required
                            className="font-mono text-sm"
                        />
                    </FormField>
                    <FormField id="description" label="Descrizione" error={errors.description} className="sm:col-span-2">
                        <Textarea id="description" rows={3} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                    </FormField>
                    <FormField
                        id="annual_term_months"
                        label="Durata licenza standard (mesi)"
                        required
                        description="Es. 12 per rinnovo / scadenza annuale."
                        error={errors.annual_term_months}
                        className="sm:col-span-2"
                    >
                        <Input
                            id="annual_term_months"
                            type="number"
                            min={1}
                            max={120}
                            value={data.annual_term_months}
                            onChange={(e) => setData('annual_term_months', Number(e.target.value))}
                            required
                        />
                    </FormField>
                    <FormField id="price" label="Prezzo (€)" error={errors.price}>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            min={0}
                            value={data.price === '' ? '' : data.price}
                            onChange={(e) => setData('price', e.target.value === '' ? '' : Number(e.target.value))}
                        />
                    </FormField>
                    <FormField id="billing_period" label="Periodo fatturazione" error={errors.billing_period}>
                        <NativeSelect
                            id="billing_period"
                            value={data.billing_period}
                            onChange={(e) => setData('billing_period', e.target.value as '' | 'monthly' | 'yearly')}
                        >
                            <option value="">—</option>
                            <option value="monthly">Mensile</option>
                            <option value="yearly">Annuale</option>
                        </NativeSelect>
                    </FormField>
                    <FormField id="trial_days" label="Giorni trial" required error={errors.trial_days}>
                        <Input
                            id="trial_days"
                            type="number"
                            min={0}
                            value={data.trial_days}
                            onChange={(e) => setData('trial_days', Number(e.target.value))}
                            required
                        />
                    </FormField>
                    <FormField id="sort_order" label="Ordine lista" required error={errors.sort_order}>
                        <Input
                            id="sort_order"
                            type="number"
                            min={0}
                            value={data.sort_order}
                            onChange={(e) => setData('sort_order', Number(e.target.value))}
                            required
                        />
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
                    <FormField id="features_json" label="Features (JSON array)" error={errors.features_json} className="sm:col-span-2">
                        <Textarea
                            id="features_json"
                            rows={8}
                            value={data.features_json}
                            onChange={(e) => setData('features_json', e.target.value)}
                            className="font-mono text-xs"
                            spellCheck={false}
                        />
                    </FormField>
                    <FormField id="is_active" label="Piano attivo" className="sm:col-span-2">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(v) => setData('is_active', v === true)}
                            />
                        </div>
                    </FormField>
                </div>
            </FormLayout>
        </PageEntityLayout>
    );
}
