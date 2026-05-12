import InputError from '@/components/input-error';
import { NativeSelect, StickyFormFooterActions, StickyReadFooterActions } from '@/components/custom';
import { WebDomainAnagraficaFields } from '@/components/domains/web/web-domain-anagrafica-fields';
import { WebDomainConnectorToolbar } from '@/components/domains/web/web-domain-connector-toolbar';
import { WebDomainWordPressTab, type WpVersionAuditPayload } from '@/components/domains/web/web-domain-wordpress-tab';
import { FtpAccountRoundtripDialog } from '@/components/domains/web/ftp-account-roundtrip-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import CrudModulePageLayout from '@/layouts/crud-module-page-layout';
import { moduleFormSurfaceClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type MemberOwnerOption } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { route } from 'ziggy-js';

interface RelOption {
    id: number;
    member_id: number;
    label: string;
}

interface FtpLastConnectionTestDto {
    success: boolean;
    kind: string;
    tested_at: string | null;
    message_preview: string | null;
}

interface FtpAccountDto {
    id: number;
    label: string;
    protocol: string;
    host: string;
    port: number | null;
    username: string;
    has_password: boolean;
    remote_base_path: string;
    is_default: boolean;
    notes: string | null;
    last_connection_test?: FtpLastConnectionTestDto | null;
}

interface EmailDto {
    id: number;
    label: string | null;
    email: string;
    purpose: string | null;
    notes: string | null;
}

interface DatabaseConnectionDto {
    id: number;
    label: string;
    driver: string;
    host: string;
    port: number | null;
    database_name: string;
    username: string;
    has_password: boolean;
    charset: string | null;
    is_default: boolean;
    notes: string | null;
}

export interface DomainDetail {
    id: number;
    member_id: number;
    hostname: string;
    customer_id: number;
    company_id: number;
    notes: string | null;
    ftp_accounts: FtpAccountDto[];
    emails: EmailDto[];
    database_connections: DatabaseConnectionDto[];
    has_ftp_accounts: boolean;
    wp_connector_token_configured: boolean;
    wordpress_tab_visible: boolean;
    wp_version_audit: WpVersionAuditPayload | null;
}

export interface FtpFormRow {
    id?: number;
    label: string;
    protocol: 'sftp' | 'ftp' | 'ftps';
    host: string;
    port: string;
    username: string;
    password: string;
    remote_base_path: string;
    is_default: boolean;
    notes: string;
    /** Presente quando l'account è già salvato: password in DB anche se il campo è vuoto. */
    has_password?: boolean;
    /** Snapshot ultimo tentativo dalla tabella storico FTP (solo account salvati). */
    last_connection_test?: FtpLastConnectionTestDto | null;
}

export interface EmailFormRow {
    id?: number;
    label: string;
    email: string;
    purpose: '' | 'contact' | 'technical' | 'billing' | 'other';
    notes: string;
}

export interface DatabaseFormRow {
    id?: number;
    label: string;
    driver: 'mysql' | 'mariadb' | 'pgsql';
    host: string;
    port: string;
    database_name: string;
    username: string;
    password: string;
    charset: string;
    is_default: boolean;
    notes: string;
    has_password?: boolean;
}

export interface WebDomainCrudPageProps {
    variant: 'edit' | 'show';
    domain: DomainDetail;
    memberOwners: MemberOwnerOption[];
    customers: RelOption[];
    companies: RelOption[];
}

function formatFtpArchiveDate(iso: string | null | undefined): string {
    if (iso == null || iso === '') return '—';
    try {
        return new Intl.DateTimeFormat('it-IT', {
            dateStyle: 'medium',
            timeStyle: 'medium',
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

function ftpTestKindLabel(kind: string): string {
    if (kind === 'roundtrip_txt') {
        return 'Round-trip (.txt)';
    }
    if (kind === 'connector_upload') {
        return 'Upload connector';
    }
    if (kind === 'connector_deploy') {
        return 'Deploy connettore WP';
    }
    return kind;
}

function mapFtpFromDomain(rows: FtpAccountDto[]): FtpFormRow[] {
    return rows.map((r) => ({
        id: r.id,
        label: r.label,
        protocol: (['sftp', 'ftp', 'ftps'].includes(r.protocol) ? r.protocol : 'sftp') as FtpFormRow['protocol'],
        host: r.host,
        port: r.port != null ? String(r.port) : '',
        username: r.username,
        password: '',
        remote_base_path: r.remote_base_path ?? '',
        is_default: r.is_default,
        notes: r.notes ?? '',
        has_password: r.has_password,
        last_connection_test: r.last_connection_test ?? null,
    }));
}

function mapEmailsFromDomain(rows: EmailDto[]): EmailFormRow[] {
    return rows.map((r) => ({
        id: r.id,
        label: r.label ?? '',
        email: r.email,
        purpose:
            r.purpose === 'contact' ||
            r.purpose === 'technical' ||
            r.purpose === 'billing' ||
            r.purpose === 'other'
                ? r.purpose
                : '',
        notes: r.notes ?? '',
    }));
}

function mapDatabaseFromDomain(rows: DatabaseConnectionDto[]): DatabaseFormRow[] {
    return rows.map((r) => ({
        id: r.id,
        label: r.label,
        driver: (['mysql', 'mariadb', 'pgsql'].includes(r.driver) ? r.driver : 'mysql') as DatabaseFormRow['driver'],
        host: r.host,
        port: r.port != null ? String(r.port) : '',
        database_name: r.database_name ?? '',
        username: r.username,
        password: '',
        charset: r.charset ?? '',
        is_default: r.is_default,
        notes: r.notes ?? '',
        has_password: r.has_password,
    }));
}

export function buildWebDomainFormStateFromDomain(domain: DomainDetail) {
    return {
        member_id: domain.member_id,
        hostname: domain.hostname,
        customer_id: domain.customer_id,
        company_id: domain.company_id,
        notes: domain.notes ?? '',
        ftp_accounts: mapFtpFromDomain(domain.ftp_accounts ?? []),
        emails: mapEmailsFromDomain(domain.emails ?? []),
        database_connections: mapDatabaseFromDomain(domain.database_connections ?? []),
    };
}

export function WebDomainCrudPage({ variant, domain, memberOwners, customers, companies }: WebDomainCrudPageProps) {
    const readOnly = variant === 'show';
    const saveRedirectMode = useRef<'stay' | 'list'>('list');
    const [ftpPwVisibleByIndex, setFtpPwVisibleByIndex] = useState<Record<number, boolean>>({});
    const [dbPwVisibleByIndex, setDbPwVisibleByIndex] = useState<Record<number, boolean>>({});

    const { data, setData, put, processing, errors, transform } = useForm(buildWebDomainFormStateFromDomain(domain));

    useEffect(() => {
        transform((payload) => {
            const p = payload as typeof data;
            const ftp_accounts = p.ftp_accounts.map((r) => {
                const row: Record<string, unknown> = {
                    label: r.label,
                    protocol: r.protocol,
                    host: r.host,
                    username: r.username,
                    remote_base_path: r.remote_base_path,
                    is_default: r.is_default,
                    notes: r.notes === '' ? null : r.notes,
                    password: r.password,
                    port: r.port.trim() === '' ? null : Number(r.port),
                };
                if (r.id) {
                    row.id = r.id;
                }
                return row;
            });

            const emails = p.emails.map((r) => {
                const row: Record<string, unknown> = {
                    label: r.label.trim() === '' ? null : r.label,
                    email: r.email,
                    purpose: r.purpose === '' ? null : r.purpose,
                    notes: r.notes === '' ? null : r.notes,
                };
                if (r.id) {
                    row.id = r.id;
                }
                return row;
            });

            const database_connections = p.database_connections.map((r) => {
                const row: Record<string, unknown> = {
                    label: r.label,
                    driver: r.driver,
                    host: r.host,
                    username: r.username,
                    database_name: r.database_name,
                    charset: r.charset.trim() === '' ? null : r.charset,
                    is_default: r.is_default,
                    notes: r.notes === '' ? null : r.notes,
                    password: r.password,
                    port: r.port.trim() === '' ? null : Number(r.port),
                };
                if (r.id) {
                    row.id = r.id;
                }
                return row;
            });

            return {
                ...p,
                save_redirect: saveRedirectMode.current,
                ftp_accounts,
                emails,
                database_connections,
            };
        });
    }, [transform]);

    const customersFiltered = useMemo(
        () => customers.filter((c) => c.member_id === data.member_id),
        [customers, data.member_id],
    );
    const companiesFiltered = useMemo(
        () => companies.filter((c) => c.member_id === data.member_id),
        [companies, data.member_id],
    );

    useEffect(() => {
        if (readOnly) {
            return;
        }
        const cf = customersFiltered;
        const co = companiesFiltered;
        const nextCustomer = cf.some((c) => c.id === data.customer_id) ? data.customer_id : (cf[0]?.id ?? 0);
        const nextCompany = co.some((c) => c.id === data.company_id) ? data.company_id : (co[0]?.id ?? 0);
        if (nextCustomer !== data.customer_id || nextCompany !== data.company_id) {
            setData({
                ...data,
                customer_id: nextCustomer,
                company_id: nextCompany,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- allineamento IDs quando cambiano le opzioni filtrate
    }, [readOnly, data.member_id, customersFiltered, companiesFiltered]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Domini', href: route('modules.web.domini.index') },
        { title: readOnly ? domain.hostname : 'Modifica' },
    ];

    const submitWithRedirect = (mode: 'stay' | 'list') => {
        if (readOnly) {
            return;
        }
        saveRedirectMode.current = mode;
        put(route('modules.web.domini.update', domain.id));
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (readOnly) {
            return;
        }
        submitWithRedirect('stay');
    };

    const disableSubmit =
        readOnly ? false : processing || customersFiltered.length === 0 || companiesFiltered.length === 0;

    const addFtpRow = () => {
        if (readOnly) {
            return;
        }
        const rows = [...data.ftp_accounts];
        const isFirst = rows.length === 0;
        rows.push({
            label: '',
            protocol: 'sftp',
            host: '',
            port: '',
            username: '',
            password: '',
            remote_base_path: '',
            is_default: isFirst,
            notes: '',
            has_password: false,
        });
        setData('ftp_accounts', rows);
    };

    const removeFtpRow = (idx: number) => {
        if (readOnly) {
            return;
        }
        const rows = data.ftp_accounts.filter((_, i) => i !== idx);
        if (rows.length && !rows.some((r) => r.is_default)) {
            rows[0].is_default = true;
        }
        setData('ftp_accounts', rows);
    };

    const setFtpDefault = (idx: number) => {
        if (readOnly) {
            return;
        }
        setData(
            'ftp_accounts',
            data.ftp_accounts.map((r, i) => ({ ...r, is_default: i === idx })),
        );
    };

    const addEmailRow = () => {
        if (readOnly) {
            return;
        }
        setData('emails', [
            ...data.emails,
            { label: '', email: '', purpose: '', notes: '' },
        ]);
    };

    const removeEmailRow = (idx: number) => {
        if (readOnly) {
            return;
        }
        setData(
            'emails',
            data.emails.filter((_, i) => i !== idx),
        );
    };

    const addDatabaseRow = () => {
        if (readOnly) {
            return;
        }
        const rows = [...data.database_connections];
        const isFirst = rows.length === 0;
        rows.push({
            label: '',
            driver: 'mysql',
            host: '',
            port: '',
            database_name: '',
            username: '',
            password: '',
            charset: '',
            is_default: isFirst,
            notes: '',
            has_password: false,
        });
        setData('database_connections', rows);
    };

    const removeDatabaseRow = (idx: number) => {
        if (readOnly) {
            return;
        }
        const rows = data.database_connections.filter((_, i) => i !== idx);
        if (rows.length && !rows.some((r) => r.is_default)) {
            rows[0].is_default = true;
        }
        setData('database_connections', rows);
    };

    const setDatabaseDefault = (idx: number) => {
        if (readOnly) {
            return;
        }
        setData(
            'database_connections',
            data.database_connections.map((r, i) => ({ ...r, is_default: i === idx })),
        );
    };

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title={readOnly ? <span className="font-mono">{domain.hostname}</span> : 'Modifica dominio'}
            documentTitle={readOnly ? domain.hostname : 'Modifica dominio'}
            processing={readOnly ? false : processing}
            stickyBar={
                readOnly ? (
                    <StickyReadFooterActions listHref={route('modules.web.domini.index')}>
                        <WebDomainConnectorToolbar
                            domainId={domain.id}
                            hasFtpAccounts={domain.has_ftp_accounts}
                            wpConnectorTokenConfigured={domain.wp_connector_token_configured}
                            disabled={disableSubmit}
                        />
                        <Button asChild>
                            <Link href={route('modules.web.domini.edit', domain.id)}>Modifica</Link>
                        </Button>
                    </StickyReadFooterActions>
                ) : (
                    <StickyFormFooterActions
                        listHref={route('modules.web.domini.index')}
                        disabled={disableSubmit}
                        onSaveStay={() => submitWithRedirect('stay')}
                        onSaveList={() => submitWithRedirect('list')}
                        trailingStart={
                            <WebDomainConnectorToolbar
                                domainId={domain.id}
                                hasFtpAccounts={domain.has_ftp_accounts}
                                wpConnectorTokenConfigured={domain.wp_connector_token_configured}
                                disabled={disableSubmit}
                            />
                        }
                    />
                )
            }
        >
            <form
                id={readOnly ? 'domini-show-form' : 'domini-edit-form'}
                onSubmit={submit}
                className={moduleFormSurfaceClassName('flex-col')}
            >
                <Tabs defaultValue="info" className="w-full gap-4">
                    <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 p-1">
                        <TabsTrigger value="info">info</TabsTrigger>
                        {domain.wordpress_tab_visible ? (
                            <TabsTrigger value="wordpress">WordPress</TabsTrigger>
                        ) : null}
                        <TabsTrigger value="ftp">FTP</TabsTrigger>
                        <TabsTrigger value="email">Email</TabsTrigger>
                        <TabsTrigger value="database">Database</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="mt-0 flex flex-col gap-6">
                        <WebDomainAnagraficaFields
                            readOnly={readOnly}
                            data={data}
                            setData={setData}
                            errors={{
                                member_id: errors.member_id as string | undefined,
                                hostname: errors.hostname as string | undefined,
                                customer_id: errors.customer_id as string | undefined,
                                company_id: errors.company_id as string | undefined,
                                notes: errors.notes as string | undefined,
                            }}
                            memberOwners={memberOwners}
                            customersFiltered={customersFiltered}
                            companiesFiltered={companiesFiltered}
                        />
                    </TabsContent>

                    {domain.wordpress_tab_visible ? (
                        <TabsContent value="wordpress" className="mt-0 flex flex-col gap-3">
                            <WebDomainWordPressTab
                                domainId={domain.id}
                                wpVersionAudit={domain.wp_version_audit}
                                wpConnectorTokenConfigured={domain.wp_connector_token_configured}
                                disabled={disableSubmit}
                            />
                        </TabsContent>
                    ) : null}

                    <TabsContent value="ftp" className="mt-0 flex flex-col gap-3">
                        <fieldset disabled={readOnly} className="mx-0 flex min-w-0 flex-col gap-3 border-0 p-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h3 className="text-sm font-semibold">Account FTP / SFTP</h3>
                            <p className="text-muted-foreground text-xs">
                                Percorso remoto = root di WordPress sul server (cartella che contiene{' '}
                                <code className="font-mono">wp-config.php</code>).
                            </p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addFtpRow}>
                            Aggiungi account
                        </Button>
                    </div>
                    <InputError message={errors.ftp_accounts as string | undefined} />
                    {data.ftp_accounts.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Nessun account configurato.</p>
                    ) : null}
                    <div className="flex flex-col gap-4">
                        {data.ftp_accounts.map((row, idx) => (
                            <div
                                key={row.id ?? `new-${idx}`}
                                className="bg-muted/20 grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-muted-foreground text-xs font-medium uppercase">
                                        FTP #{idx + 1}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <FtpAccountRoundtripDialog
                                            domainId={domain.id}
                                            ftpAccountId={row.id}
                                            ftpLabel={row.label}
                                            canRunTest={
                                                row.id != null &&
                                                row.host.trim() !== '' &&
                                                row.username.trim() !== '' &&
                                                (row.password !== '' || row.has_password === true)
                                            }
                                        />
                                        <label className="flex items-center gap-2 text-xs">
                                            <Checkbox
                                                checked={row.is_default}
                                                onCheckedChange={(checked) => {
                                                    if (checked === true) {
                                                        setFtpDefault(idx);
                                                    }
                                                }}
                                            />
                                            Predefinito
                                        </label>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeFtpRow(idx)}>
                                            Rimuovi
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div className="grid gap-1">
                                        <Label className="text-xs">Etichetta</Label>
                                        <Input
                                            value={row.label}
                                            onChange={(e) => {
                                                const next = [...data.ftp_accounts];
                                                next[idx].label = e.target.value;
                                                setData('ftp_accounts', next);
                                            }}
                                            placeholder="Hosting principale"
                                        />
                                        <InputError message={(errors as Record<string, string>)[`ftp_accounts.${idx}.label`]} />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label className="text-xs">Protocollo</Label>
                                        <NativeSelect
                                            value={row.protocol}
                                            onChange={(e) => {
                                                const next = [...data.ftp_accounts];
                                                next[idx].protocol = e.target.value as FtpFormRow['protocol'];
                                                setData('ftp_accounts', next);
                                            }}
                                        >
                                            <option value="sftp">SFTP</option>
                                            <option value="ftp">FTP</option>
                                            <option value="ftps">FTPS</option>
                                        </NativeSelect>
                                        <InputError
                                            message={(errors as Record<string, string>)[`ftp_accounts.${idx}.protocol`]}
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label className="text-xs">Host</Label>
                                        <Input
                                            value={row.host}
                                            onChange={(e) => {
                                                const next = [...data.ftp_accounts];
                                                next[idx].host = e.target.value;
                                                setData('ftp_accounts', next);
                                            }}
                                            placeholder="ftp.esempio.it"
                                            className="font-mono"
                                        />
                                        <InputError message={(errors as Record<string, string>)[`ftp_accounts.${idx}.host`]} />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label className="text-xs">Porta (vuoto = default)</Label>
                                        <Input
                                            value={row.port}
                                            onChange={(e) => {
                                                const next = [...data.ftp_accounts];
                                                next[idx].port = e.target.value;
                                                setData('ftp_accounts', next);
                                            }}
                                            placeholder="22 / 21"
                                            className="font-mono"
                                        />
                                        <InputError message={(errors as Record<string, string>)[`ftp_accounts.${idx}.port`]} />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label className="text-xs">Utente</Label>
                                        <Input
                                            value={row.username}
                                            onChange={(e) => {
                                                const next = [...data.ftp_accounts];
                                                next[idx].username = e.target.value;
                                                setData('ftp_accounts', next);
                                            }}
                                            autoComplete="off"
                                            className="font-mono"
                                        />
                                        <InputError
                                            message={(errors as Record<string, string>)[`ftp_accounts.${idx}.username`]}
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label className="text-xs">
                                            Password
                                            {row.id != null ? (
                                                <span className="text-muted-foreground font-normal">
                                                    {' '}
                                                    (lascia vuoto per non modificare)
                                                </span>
                                            ) : null}
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                type={
                                                    ftpPwVisibleByIndex[idx] === true ? 'text' : 'password'
                                                }
                                                value={row.password}
                                                onChange={(e) => {
                                                    const next = [...data.ftp_accounts];
                                                    next[idx].password = e.target.value;
                                                    setData('ftp_accounts', next);
                                                }}
                                                autoComplete="new-password"
                                                placeholder={row.id != null ? '••••••••' : ''}
                                                className="pr-10"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                tabIndex={-1}
                                                className="absolute top-0 right-0 h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                                                onClick={() =>
                                                    setFtpPwVisibleByIndex((prev) => ({
                                                        ...prev,
                                                        [idx]: !prev[idx],
                                                    }))
                                                }
                                                aria-label={
                                                    ftpPwVisibleByIndex[idx]
                                                        ? 'Nascondi password'
                                                        : 'Mostra password'
                                                }
                                                aria-pressed={ftpPwVisibleByIndex[idx] === true}
                                            >
                                                {ftpPwVisibleByIndex[idx] ? (
                                                    <EyeOff className="size-4" />
                                                ) : (
                                                    <Eye className="size-4" />
                                                )}
                                            </Button>
                                        </div>
                                        <InputError
                                            message={(errors as Record<string, string>)[`ftp_accounts.${idx}.password`]}
                                        />
                                    </div>
                                    <div className="grid gap-1 sm:col-span-2">
                                        <Label className="text-xs">Percorso root WordPress sul server</Label>
                                        <Input
                                            value={row.remote_base_path}
                                            onChange={(e) => {
                                                const next = [...data.ftp_accounts];
                                                next[idx].remote_base_path = e.target.value;
                                                setData('ftp_accounts', next);
                                            }}
                                            placeholder="es. public_html o www/esempio.it"
                                            className="font-mono"
                                        />
                                        <InputError
                                            message={
                                                (errors as Record<string, string>)[`ftp_accounts.${idx}.remote_base_path`]
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1 sm:col-span-2">
                                        <Label className="text-xs">Note</Label>
                                        <Textarea
                                            value={row.notes}
                                            onChange={(e) => {
                                                const next = [...data.ftp_accounts];
                                                next[idx].notes = e.target.value;
                                                setData('ftp_accounts', next);
                                            }}
                                            rows={2}
                                        />
                                    </div>
                                </div>
                                {row.last_connection_test?.tested_at ? (
                                    <div className="text-muted-foreground border-sidebar-border/60 mt-1 border-t pt-3 text-xs leading-snug">
                                        <span className="font-medium text-foreground">Ultimo test FTP in archivio:</span>{' '}
                                        {formatFtpArchiveDate(row.last_connection_test.tested_at)} —{' '}
                                        {row.last_connection_test.success ? (
                                            <span className="text-green-700 dark:text-green-400">OK</span>
                                        ) : (
                                            <span className="text-destructive">fallito</span>
                                        )}{' '}
                                        <span className="text-muted-foreground">
                                            ({ftpTestKindLabel(row.last_connection_test.kind)})
                                        </span>
                                        {row.last_connection_test.message_preview ? (
                                            <span className="mt-1 block italic">{row.last_connection_test.message_preview}</span>
                                        ) : null}
                                    </div>
                                ) : row.id != null ? (
                                    <div className="text-muted-foreground border-sidebar-border/60 mt-1 border-t pt-3 text-xs">
                                        Nessun tentativo FTP salvato nella cronologia test finora — compariranno data e
                                        ora dopo il primo test.
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                        </fieldset>
                    </TabsContent>

                    <TabsContent value="email" className="mt-0 flex flex-col gap-3">
                        <fieldset disabled={readOnly} className="mx-0 flex min-w-0 flex-col gap-3 border-0 p-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h3 className="text-sm font-semibold">Email associate al dominio</h3>
                            <p className="text-muted-foreground text-xs">Indirizzi di contatto o tecnici (senza password).</p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addEmailRow}>
                            Aggiungi email
                        </Button>
                    </div>
                    <InputError message={errors.emails as string | undefined} />
                    {data.emails.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Nessuna email configurata.</p>
                    ) : null}
                    <div className="flex flex-col gap-4">
                        {data.emails.map((row, idx) => (
                            <div
                                key={row.id ?? `em-new-${idx}`}
                                className="bg-muted/20 grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                            >
                                <div className="flex justify-between gap-2">
                                    <span className="text-muted-foreground text-xs font-medium uppercase">
                                        Email #{idx + 1}
                                    </span>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeEmailRow(idx)}>
                                        Rimuovi
                                    </Button>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div className="grid gap-1">
                                        <Label className="text-xs">Etichetta</Label>
                                        <Input
                                            value={row.label}
                                            onChange={(e) => {
                                                const next = [...data.emails];
                                                next[idx].label = e.target.value;
                                                setData('emails', next);
                                            }}
                                            placeholder="PEC / Referente"
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label className="text-xs">Email</Label>
                                        <Input
                                            type="email"
                                            value={row.email}
                                            onChange={(e) => {
                                                const next = [...data.emails];
                                                next[idx].email = e.target.value;
                                                setData('emails', next);
                                            }}
                                            required
                                            className="font-mono"
                                        />
                                        <InputError message={(errors as Record<string, string>)[`emails.${idx}.email`]} />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label className="text-xs">Tipo</Label>
                                        <NativeSelect
                                            value={row.purpose}
                                            onChange={(e) => {
                                                const next = [...data.emails];
                                                next[idx].purpose = e.target.value as EmailFormRow['purpose'];
                                                setData('emails', next);
                                            }}
                                        >
                                            <option value="">—</option>
                                            <option value="contact">Contatto</option>
                                            <option value="technical">Tecnico</option>
                                            <option value="billing">Amministrativo</option>
                                            <option value="other">Altro</option>
                                        </NativeSelect>
                                    </div>
                                    <div className="grid gap-1 sm:col-span-2">
                                        <Label className="text-xs">Note</Label>
                                        <Textarea
                                            value={row.notes}
                                            onChange={(e) => {
                                                const next = [...data.emails];
                                                next[idx].notes = e.target.value;
                                                setData('emails', next);
                                            }}
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                        </fieldset>
                    </TabsContent>

                    <TabsContent value="database" className="mt-0 flex flex-col gap-3">
                        <fieldset disabled={readOnly} className="mx-0 flex min-w-0 flex-col gap-3 border-0 p-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h3 className="text-sm font-semibold">Connessioni database</h3>
                                <p className="text-muted-foreground text-xs">
                                    Credenziali del DB usato dall&apos;installazione sul dominio (es. WordPress). Password
                                    cifrata sul server — non vengono mostrate dopo il salvataggio.
                                </p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addDatabaseRow}>
                                Aggiungi connessione
                            </Button>
                        </div>
                        <InputError message={errors.database_connections as string | undefined} />
                        {data.database_connections.length === 0 ? (
                            <p className="text-muted-foreground text-sm">Nessuna connessione configurata.</p>
                        ) : null}
                        <div className="flex flex-col gap-4">
                            {data.database_connections.map((row, idx) => (
                                <div
                                    key={row.id ?? `db-new-${idx}`}
                                    className="bg-muted/20 grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-muted-foreground text-xs font-medium uppercase">
                                            DB #{idx + 1}
                                        </span>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <label className="flex items-center gap-2 text-xs">
                                                <Checkbox
                                                    checked={row.is_default}
                                                    onCheckedChange={(checked) => {
                                                        if (checked === true) {
                                                            setDatabaseDefault(idx);
                                                        }
                                                    }}
                                                />
                                                Predefinito
                                            </label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeDatabaseRow(idx)}
                                            >
                                                Rimuovi
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <div className="grid gap-1">
                                            <Label className="text-xs">Etichetta</Label>
                                            <Input
                                                value={row.label}
                                                onChange={(e) => {
                                                    const next = [...data.database_connections];
                                                    next[idx].label = e.target.value;
                                                    setData('database_connections', next);
                                                }}
                                                placeholder="DB produzione"
                                            />
                                            <InputError
                                                message={
                                                    (errors as Record<string, string>)['database_connections.' + idx + '.label']
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label className="text-xs">Driver</Label>
                                            <NativeSelect
                                                value={row.driver}
                                                onChange={(e) => {
                                                    const next = [...data.database_connections];
                                                    next[idx].driver = e.target.value as DatabaseFormRow['driver'];
                                                    setData('database_connections', next);
                                                }}
                                            >
                                                <option value="mysql">MySQL</option>
                                                <option value="mariadb">MariaDB</option>
                                                <option value="pgsql">PostgreSQL</option>
                                            </NativeSelect>
                                            <InputError
                                                message={
                                                    (errors as Record<string, string>)['database_connections.' + idx + '.driver']
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label className="text-xs">Host</Label>
                                            <Input
                                                value={row.host}
                                                onChange={(e) => {
                                                    const next = [...data.database_connections];
                                                    next[idx].host = e.target.value;
                                                    setData('database_connections', next);
                                                }}
                                                placeholder="localhost o db.provider.it"
                                                className="font-mono"
                                                autoComplete="off"
                                            />
                                            <InputError
                                                message={
                                                    (errors as Record<string, string>)['database_connections.' + idx + '.host']
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label className="text-xs">Porta (vuoto = default)</Label>
                                            <Input
                                                value={row.port}
                                                onChange={(e) => {
                                                    const next = [...data.database_connections];
                                                    next[idx].port = e.target.value;
                                                    setData('database_connections', next);
                                                }}
                                                placeholder="3306 / 5432"
                                                className="font-mono"
                                            />
                                            <InputError
                                                message={
                                                    (errors as Record<string, string>)['database_connections.' + idx + '.port']
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label className="text-xs">Nome database</Label>
                                            <Input
                                                value={row.database_name}
                                                onChange={(e) => {
                                                    const next = [...data.database_connections];
                                                    next[idx].database_name = e.target.value;
                                                    setData('database_connections', next);
                                                }}
                                                className="font-mono"
                                                autoComplete="off"
                                            />
                                            <InputError
                                                message={
                                                    (errors as Record<string, string>)['database_connections.' + idx +
                                                        '.database_name']
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label className="text-xs">Charset / encoding (facoltativo)</Label>
                                            <Input
                                                value={row.charset}
                                                onChange={(e) => {
                                                    const next = [...data.database_connections];
                                                    next[idx].charset = e.target.value;
                                                    setData('database_connections', next);
                                                }}
                                                placeholder="utf8mb4 (MySQL)"
                                                className="font-mono"
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label className="text-xs">Utente</Label>
                                            <Input
                                                value={row.username}
                                                onChange={(e) => {
                                                    const next = [...data.database_connections];
                                                    next[idx].username = e.target.value;
                                                    setData('database_connections', next);
                                                }}
                                                className="font-mono"
                                                autoComplete="off"
                                            />
                                            <InputError
                                                message={
                                                    (errors as Record<string, string>)['database_connections.' + idx +
                                                        '.username']
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-1 sm:col-span-2">
                                            <Label className="text-xs">
                                                Password
                                                {row.id != null ? (
                                                    <span className="text-muted-foreground font-normal">
                                                        {' '}
                                                        (lascia vuoto per non modificare)
                                                    </span>
                                                ) : null}
                                            </Label>
                                            <div className="relative max-w-md">
                                                <Input
                                                    type={dbPwVisibleByIndex[idx] === true ? 'text' : 'password'}
                                                    value={row.password}
                                                    onChange={(e) => {
                                                        const next = [...data.database_connections];
                                                        next[idx].password = e.target.value;
                                                        setData('database_connections', next);
                                                    }}
                                                    autoComplete="new-password"
                                                    placeholder={row.id != null ? '••••••••' : ''}
                                                    className="pr-10 font-mono"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    tabIndex={-1}
                                                    className="absolute top-0 right-0 h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                                                    onClick={() =>
                                                        setDbPwVisibleByIndex((prev) => ({
                                                            ...prev,
                                                            [idx]: !prev[idx],
                                                        }))
                                                    }
                                                    aria-label={
                                                        dbPwVisibleByIndex[idx] ? 'Nascondi password' : 'Mostra password'
                                                    }
                                                    aria-pressed={dbPwVisibleByIndex[idx] === true}
                                                >
                                                    {dbPwVisibleByIndex[idx] ? (
                                                        <EyeOff className="size-4" />
                                                    ) : (
                                                        <Eye className="size-4" />
                                                    )}
                                                </Button>
                                            </div>
                                            <InputError
                                                message={
                                                    (errors as Record<string, string>)['database_connections.' + idx +
                                                        '.password']
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-1 sm:col-span-2">
                                            <Label className="text-xs">Note</Label>
                                            <Textarea
                                                value={row.notes}
                                                onChange={(e) => {
                                                    const next = [...data.database_connections];
                                                    next[idx].notes = e.target.value;
                                                    setData('database_connections', next);
                                                }}
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        </fieldset>
                    </TabsContent>
                </Tabs>
            </form>
        </CrudModulePageLayout>
    );
}
