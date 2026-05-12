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

export default function LicensePlansCreate() {
    const redirectToIndexAfterSave = useRef(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Piani licenza', href: route('license-plans.index') },
        { title: 'Nuovo' },
    ];

    const { data, setData, post, processing, errors, transform } = useForm({
        name: '',
        slug: '',
        package_tier: '' as '' | 'basic' | 'premium' | 'enterprise',
        description: '',
        price: '' as number | '',
        billing_period: '' as '' | 'monthly' | 'yearly',
        annual_term_months: 12,
        trial_days: 0,
        max_customers: '' as number | '',
        max_sub_members: '' as number | '',
        features_json: '[]',
        is_active: true,
        sort_order: 0,
    });

    useEffect(() => {
        transform((payload) => ({
            ...payload,
            slug: payload.slug === '' ? null : payload.slug,
            package_tier: payload.package_tier === '' ? null : payload.package_tier,
            description: payload.description === '' ? null : payload.description,
            price: payload.price === '' ? null : payload.price,
            billing_period: payload.billing_period === '' ? null : payload.billing_period,
            max_customers: payload.max_customers === '' ? null : payload.max_customers,
            max_sub_members: payload.max_sub_members === '' ? null : payload.max_sub_members,
            features_json: payload.features_json.trim() === '' ? null : payload.features_json,
            redirect_to_index: redirectToIndexAfterSave.current,
        }));
    }, [transform]);

    const runPost = () => {
        post(route('license-plans.store'));
    };

    const submitToDetail: FormEventHandler = (e) => {
        e.preventDefault();
        redirectToIndexAfterSave.current = false;
        runPost();
    };

    const saveStay = () => {
        redirectToIndexAfterSave.current = false;
        runPost();
    };

    const saveList = () => {
        redirectToIndexAfterSave.current = true;
        runPost();
    };

    return (
        <PageEntityLayout
            title="Nuovo piano licenza"
            description="Slug generato dal nome se lasci vuoto. Features: array JSON di stringhe."
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
                    <FormField id="slug" label="Slug (opzionale)" error={errors.slug}>
                        <Input
                            id="slug"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                            placeholder="es. starter"
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
                    <FormField id="max_customers" label="Max clienti (vuoto = ∞)" error={errors.max_customers}>
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
                    <FormField id="max_sub_members" label="Max sub-member (vuoto = ∞)" error={errors.max_sub_members}>
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
