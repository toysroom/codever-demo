import { EditButton } from '@/components/custom';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageEntityLayout from '@/layouts/page-entity-layout';
import { entityReadonlyCardClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { useFlashMessages } from '@/hooks';
import { router, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { route } from 'ziggy-js';

interface PerpetualCodeRow {
    id: number;
    code: string;
    notes: string | null;
    is_active: boolean;
    created_at: string | null;
}

interface PlanDetail {
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
    members_count: number;
    perpetual_codes: PerpetualCodeRow[];
}

interface Props {
    plan: PlanDetail;
}

function billingLabel(period: string | null): string {
    if (!period) {
        return '—';
    }
    if (period === 'monthly') {
        return 'Mensile';
    }
    if (period === 'yearly') {
        return 'Annuale';
    }
    return period;
}

function tierLabel(tier: string | null): string {
    if (!tier) {
        return '—';
    }
    if (tier === 'basic') {
        return 'Basic';
    }
    if (tier === 'premium') {
        return 'Premium';
    }
    if (tier === 'enterprise') {
        return 'Enterprise';
    }
    return tier;
}

export default function LicensePlansShow({ plan }: Props) {
    useFlashMessages();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Piani licenza', href: route('license-plans.index') },
        { title: plan.name },
    ];

    const codeForm = useForm({
        code: '',
        notes: '',
        is_active: true,
    });

    const submitCode: FormEventHandler = (e) => {
        e.preventDefault();
        codeForm.post(route('license-plans.perpetual-codes.store', plan.id), {
            preserveScroll: true,
            onSuccess: () => codeForm.reset(),
        });
    };

    const removeCode = (codeId: number) => {
        if (!confirm('Rimuovere questo codice?')) {
            return;
        }
        router.delete(
            route('license-plans.perpetual-codes.destroy', { license_plan: plan.id, perpetual_code: codeId }),
            { preserveScroll: true },
        );
    };

    return (
        <PageEntityLayout
            title={plan.name}
            description="Scheda piano licenza: pacchetto, costo, durata annuale e codici senza scadenza."
            breadcrumbs={breadcrumbs}
            footerMode="readonly"
            listHref={route('license-plans.index')}
            listLabel="Torna ai piani licenza"
            readonlyTrailing={<EditButton href={route('license-plans.edit', plan.id)} />}
        >
            <div className="grid gap-6 lg:grid-cols-2">
                <div className={entityReadonlyCardClassName()}>
                    <h2 className="mb-3 text-sm font-semibold">Generale</h2>
                    <dl className="grid gap-2 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Pacchetto</dt>
                            <dd>{tierLabel(plan.package_tier)}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Slug</dt>
                            <dd className="font-mono text-xs">{plan.slug}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Ordine elenco</dt>
                            <dd>{plan.sort_order}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Stato</dt>
                            <dd className={plan.is_active ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                                {plan.is_active ? 'Attivo' : 'Disattivo'}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Account assegnati</dt>
                            <dd>{plan.members_count}</dd>
                        </div>
                        {plan.description ? (
                            <div className="col-span-full mt-1 text-muted-foreground">{plan.description}</div>
                        ) : null}
                    </dl>
                </div>
                <div className={entityReadonlyCardClassName()}>
                    <h2 className="mb-3 text-sm font-semibold">Prezzo e scadenza</h2>
                    <dl className="grid gap-2 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Prezzo</dt>
                            <dd>{plan.price != null && plan.price !== '' ? `€ ${plan.price}` : '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Fatturazione</dt>
                            <dd>{billingLabel(plan.billing_period)}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Durata licenza standard</dt>
                            <dd>
                                {plan.annual_term_months} {plan.annual_term_months === 1 ? 'mese' : 'mesi'} (rinnovo)
                            </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Giorni trial</dt>
                            <dd>{plan.trial_days}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Max clienti</dt>
                            <dd>{plan.max_customers ?? '∞'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Max sub-member</dt>
                            <dd>{plan.max_sub_members ?? '∞'}</dd>
                        </div>
                    </dl>
                </div>
                <div className={entityReadonlyCardClassName('lg:col-span-2')}>
                    <h2 className="mb-3 text-sm font-semibold">Codici licenza illimitata</h2>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Codici associati a questo piano per attivazioni senza scadenza (gestione commerciale / lifetime).
                    </p>
                    <form onSubmit={submitCode} className="mb-6 grid gap-4 rounded-lg border border-dashed p-4 sm:grid-cols-2">
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="new_code">Nuovo codice</Label>
                            <Input
                                id="new_code"
                                value={codeForm.data.code}
                                onChange={(e) => codeForm.setData('code', e.target.value)}
                                placeholder="ES. VIP-2026-ABCD"
                                className="font-mono uppercase"
                                autoComplete="off"
                            />
                            <InputError message={codeForm.errors.code} />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="code_notes">Note (opz.)</Label>
                            <Input
                                id="code_notes"
                                value={codeForm.data.notes}
                                onChange={(e) => codeForm.setData('notes', e.target.value)}
                            />
                            <InputError message={codeForm.errors.notes} />
                        </div>
                        <div className="flex items-center gap-2 sm:col-span-2">
                            <Checkbox
                                id="code_active"
                                checked={codeForm.data.is_active}
                                onCheckedChange={(v) => codeForm.setData('is_active', v === true)}
                            />
                            <Label htmlFor="code_active">Codice attivo</Label>
                        </div>
                        <div className="sm:col-span-2">
                            <Button type="submit" disabled={codeForm.processing}>
                                Aggiungi codice
                            </Button>
                        </div>
                    </form>
                    {plan.perpetual_codes.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Nessun codice definito.</p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/40">
                                    <tr>
                                        <th className="px-3 py-2 font-medium">Codice</th>
                                        <th className="px-3 py-2 font-medium">Note</th>
                                        <th className="px-3 py-2 font-medium">Stato</th>
                                        <th className="px-3 py-2 font-medium text-right">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plan.perpetual_codes.map((row) => (
                                        <tr key={row.id} className="border-t">
                                            <td className="px-3 py-2 font-mono text-xs">{row.code}</td>
                                            <td className="text-muted-foreground px-3 py-2 text-xs">{row.notes ?? '—'}</td>
                                            <td className="px-3 py-2 text-xs">
                                                {row.is_active ? (
                                                    <span className="text-green-600 dark:text-green-400">Attivo</span>
                                                ) : (
                                                    <span className="text-muted-foreground">Disattivo</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => removeCode(row.id)}
                                                    disabled={codeForm.processing}
                                                >
                                                    Elimina
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div className={entityReadonlyCardClassName('lg:col-span-2')}>
                    <h2 className="mb-3 text-sm font-semibold">Features (JSON)</h2>
                    <pre className="max-h-96 overflow-auto rounded-lg bg-muted/50 p-4 font-mono text-xs leading-relaxed">
                        {plan.features_json.trim() === '' ? '[]' : plan.features_json}
                    </pre>
                </div>
            </div>
        </PageEntityLayout>
    );
}
