import { EditButton } from '@/components/custom';
import PageEntityLayout from '@/layouts/page-entity-layout';
import { entityReadonlyCardClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { format, parseISO } from 'date-fns';
import { route } from 'ziggy-js';

interface LicensePlanDetail {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    plan_max_customers: number | null;
    plan_max_sub_members: number | null;
}

interface OwnerDetail {
    name: string;
    email: string;
    is_active: boolean;
    email_verified_at: string | null;
    created_at: string | null;
}

interface ModuleRow {
    id: number;
    slug: string;
    name: string;
    status: string | null;
    starts_at: string | null;
    ends_at: string | null;
}

interface AccountDetail {
    id: number;
    company_name: string | null;
    company_vat: string | null;
    license_plan_id: number | null;
    max_customers: number | null;
    max_sub_members: number | null;
    subscription_status: string | null;
    created_at: string | null;
    updated_at: string | null;
    license_plan: LicensePlanDetail | null;
    owner: OwnerDetail;
    counts: {
        customers: number;
        sub_members: number;
    };
    modules: ModuleRow[];
}

interface Props {
    account: AccountDetail;
}

function fmt(iso: string | null): string {
    if (!iso) {
        return '—';
    }
    try {
        return format(parseISO(iso), 'dd/MM/yyyy HH:mm');
    } catch {
        return iso;
    }
}

export default function AccountsShow({ account }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Account', href: route('accounts.index') },
        { title: account.company_name ?? `#${account.id}` },
    ];

    return (
        <PageEntityLayout
            title={account.company_name ?? `Account #${account.id}`}
            description="Scheda account (sola lettura): piano, moduli e metriche."
            breadcrumbs={breadcrumbs}
            footerMode="readonly"
            listHref={route('accounts.index')}
            listLabel="Torna all'elenco account"
            readonlyTrailing={<EditButton href={route('accounts.edit', account.id)} />}
        >
            <div className="grid gap-6 lg:grid-cols-2">
                <div className={entityReadonlyCardClassName()}>
                        <h2 className="mb-3 text-sm font-semibold">Organizzazione</h2>
                        <dl className="grid gap-2 text-sm">
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">P.IVA</dt>
                                <dd>{account.company_vat ?? '—'}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">Subscription</dt>
                                <dd>{account.subscription_status ?? '—'}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">Max clienti</dt>
                                <dd>{account.max_customers ?? '∞'}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">Max sub-member</dt>
                                <dd>{account.max_sub_members ?? '∞'}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">Creato</dt>
                                <dd>{fmt(account.created_at)}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">Aggiornato</dt>
                                <dd>{fmt(account.updated_at)}</dd>
                            </div>
                        </dl>
                </div>
                <div className={entityReadonlyCardClassName()}>
                        <h2 className="mb-3 text-sm font-semibold">Owner</h2>
                        <dl className="grid gap-2 text-sm">
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">Nome</dt>
                                <dd>{account.owner.name}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">Email</dt>
                                <dd className={account.owner.is_active ? '' : 'text-muted-foreground line-through'}>
                                    {account.owner.email}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">Email verificata</dt>
                                <dd>{fmt(account.owner.email_verified_at)}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">Utente creato</dt>
                                <dd>{fmt(account.owner.created_at)}</dd>
                            </div>
                        </dl>
                </div>
                <div className={entityReadonlyCardClassName('lg:col-span-2')}>
                        <h2 className="mb-3 text-sm font-semibold">Piano licenza</h2>
                        {account.license_plan ? (
                            <dl className="grid gap-2 text-sm">
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">Nome</dt>
                                    <dd>{account.license_plan.name}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">Slug</dt>
                                    <dd className="font-mono text-xs">{account.license_plan.slug}</dd>
                                </div>
                                {account.license_plan.description ? (
                                    <div className="mt-1 text-muted-foreground">{account.license_plan.description}</div>
                                ) : null}
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">Limiti piano (clienti / sub)</dt>
                                    <dd>
                                        {account.license_plan.plan_max_customers ?? '∞'} /{' '}
                                        {account.license_plan.plan_max_sub_members ?? '∞'}
                                    </dd>
                                </div>
                            </dl>
                        ) : (
                            <p className="text-muted-foreground text-sm">Nessun piano assegnato.</p>
                        )}
                </div>
                <div className={entityReadonlyCardClassName('lg:col-span-2')}>
                        <h2 className="mb-3 text-sm font-semibold">Metriche</h2>
                        <div className="flex flex-wrap gap-6 text-sm">
                            <div>
                                <span className="text-muted-foreground">Clienti</span>
                                <div className="text-2xl font-semibold">{account.counts.customers}</div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Sub-member</span>
                                <div className="text-2xl font-semibold">{account.counts.sub_members}</div>
                            </div>
                        </div>
                </div>
                <div className={entityReadonlyCardClassName('lg:col-span-2')}>
                        <h2 className="mb-3 text-sm font-semibold">Moduli attivi</h2>
                        {account.modules.length === 0 ? (
                            <p className="text-muted-foreground text-sm">Nessun modulo.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="py-2 pr-4 font-medium">Modulo</th>
                                            <th className="py-2 pr-4 font-medium">Slug</th>
                                            <th className="py-2 pr-4 font-medium">Stato</th>
                                            <th className="py-2 font-medium">Periodo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {account.modules.map((m) => (
                                            <tr key={m.id} className="border-b border-muted/50">
                                                <td className="py-2 pr-4">{m.name}</td>
                                                <td className="py-2 pr-4 font-mono text-xs">{m.slug}</td>
                                                <td className="py-2 pr-4">{m.status ?? '—'}</td>
                                                <td className="py-2 text-muted-foreground text-xs">
                                                    {fmt(m.starts_at)} → {fmt(m.ends_at)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                </div>
            </div>
        </PageEntityLayout>
    );
}
