import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

type DashboardProps = {
    stats: {
        users_total: number | null;
        users_active: number | null;
        roles_total: number | null;
        permissions_total: number | null;
        customers_total: number;
        accounts_total: number | null;
        crm_pending_reminders: number;
        customers_missing_vat: number;
        customers_missing_email: number;
        companies_missing_vat: number;
        products_missing_category: number;
    };
};

type StatItem = {
    label: string;
    value: number | null;
    hint: string;
    href?: string;
    emphasizeWhenPositive?: boolean;
};

function StatCard({ label, value, hint, href, emphasizeWhenPositive }: StatItem) {
    const numeric = value ?? 0;
    const showAttention = emphasizeWhenPositive && numeric > 0;

    const inner = (
        <>
            <CardHeader className="pb-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-semibold tracking-tight">
                    {value === null ? '—' : value.toLocaleString('it-IT')}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </CardContent>
        </>
    );

    return (
        <Card
            className={cn(
                'gap-3 transition-colors',
                showAttention && 'border-amber-500/60 bg-amber-500/5 dark:border-amber-500/40 dark:bg-amber-500/10',
            )}
        >
            {href ? (
                <Link href={href} className="block cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {inner}
                </Link>
            ) : (
                inner
            )}
        </Card>
    );
}

export default function Dashboard({ stats }: DashboardProps) {
    const statCards: StatItem[] = [
        { label: 'Utenti totali', value: stats.users_total, hint: 'Account registrati nel sistema' },
        { label: 'Utenti attivi', value: stats.users_active, hint: 'Account con stato attivo' },
        { label: 'Ruoli', value: stats.roles_total, hint: 'Ruoli disponibili' },
        { label: 'Permessi', value: stats.permissions_total, hint: 'Permessi configurati' },
        { label: 'Clienti', value: stats.customers_total, hint: 'Clienti visibili dal tuo profilo' },
        { label: 'Account owner', value: stats.accounts_total, hint: 'Organizzazioni principali (member owner) attive' },
        { label: 'Reminder CRM in attesa', value: stats.crm_pending_reminders, hint: 'Promemoria da processare in coda' },
    ];

    const incompleteCards: StatItem[] = [
        {
            label: 'Clienti senza P.IVA',
            value: stats.customers_missing_vat,
            hint: 'Partita IVA assente o vuota in anagrafica cliente',
            href: route('modules.customers.index'),
            emphasizeWhenPositive: true,
        },
        {
            label: 'Clienti senza email di contatto',
            value: stats.customers_missing_email,
            hint: 'Email di contatto assente o vuota',
            href: route('modules.customers.index'),
            emphasizeWhenPositive: true,
        },
        {
            label: 'Aziende senza P.IVA',
            value: stats.companies_missing_vat,
            hint: 'Righe società senza partita IVA (es. per fatturazione o Web)',
            href: route('modules.companies.index'),
            emphasizeWhenPositive: true,
        },
        {
            label: 'Prodotti senza categoria',
            value: stats.products_missing_category,
            hint: 'Prodotti catalogo non associati a una categoria',
            href: route('modules.products.prodotti.index'),
            emphasizeWhenPositive: true,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-8 overflow-x-auto rounded-xl p-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Panoramica</h1>
                    <p className="text-sm text-muted-foreground">Statistiche principali del sistema e del modulo CRM.</p>
                </div>
                <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((item) => (
                        <StatCard key={item.label} {...item} />
                    ))}
                </div>

                <div>
                    <h2 className="text-lg font-semibold tracking-tight">Dati da completare</h2>
                    <p className="text-sm text-muted-foreground">
                        Conteggi delle anagrafiche con campi obbligatori per il processo ancora vuoti o assenti (stesso
                        ambito dati della tabella precedente).
                    </p>
                    <div className="mt-4 grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {incompleteCards.map((item) => (
                            <StatCard key={item.label} {...item} />
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
