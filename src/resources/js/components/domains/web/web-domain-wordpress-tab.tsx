import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { route } from 'ziggy-js';

function csrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

export type WpVersionRowStatus = 'inactive' | 'current' | 'outdated' | 'unknown';

export interface WpAuditRow {
    name: string;
    slug: string;
    current_version: string;
    latest_version: string | null;
    /** ISO 8601: ultimo aggiornamento della voce su repository (WordPress.org / zip core). */
    latest_repo_updated_at?: string | null;
    active?: boolean;
    notes?: string | null;
    /** Da audit PHP; se assente viene dedotto in UI per dati vecchi. */
    version_status?: WpVersionRowStatus;
}

export interface WpAuditGroup {
    id: string;
    label: string;
    rows: WpAuditRow[];
}

export interface WpVersionAuditPayload {
    generated_at?: string;
    groups?: WpAuditGroup[];
    errors?: string[];
    /** JSON grezzo site-info (`plugins` da ≥ 1.1.0; elenco `themes` da ≥ 1.1.2). */
    source_site_info?: Record<string, unknown>;
}

function isPluginSourceRow(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null;
}

/** Righe tabella: usa `groups`, oppure `source_site_info` se le righe salvate sono vuote (dati legacy / refresh parziale). */
function rowsForGroup(group: WpAuditGroup, audit: WpVersionAuditPayload | null): WpAuditRow[] {
    const base = Array.isArray(group.rows) ? group.rows : [];
    if (base.length > 0 || !audit?.source_site_info) {
        return base;
    }
    const src = audit.source_site_info;
    const fallbackNote =
        'Confronto repository non calcolato per questa riga: riesegui «Aggiorna da sito» con Zelante Connector ≥ 1.1.2 sul sito WordPress.';

    if (group.id === 'plugins') {
        const raw = src.plugins;
        if (!Array.isArray(raw)) {
            return base;
        }
        const out: WpAuditRow[] = [];
        for (const item of raw) {
            if (!isPluginSourceRow(item)) {
                continue;
            }
            const slug = typeof item.slug === 'string' ? item.slug : '';
            const name = typeof item.name === 'string' ? item.name : slug;
            const ver = typeof item.version === 'string' ? item.version : '';
            const active = item.active === true;
            out.push({
                name: name !== '' ? name : '—',
                slug: slug !== '' ? slug : '—',
                current_version: ver !== '' ? ver : '—',
                latest_version: null,
                latest_repo_updated_at: null,
                active,
                notes: fallbackNote,
            });
        }
        return out;
    }

    if (group.id === 'themes' || group.id === 'theme') {
        const raw = src.themes;
        if (!Array.isArray(raw)) {
            return base;
        }
        const out: WpAuditRow[] = [];
        for (const item of raw) {
            if (!isPluginSourceRow(item)) {
                continue;
            }
            const slug =
                typeof item.slug === 'string'
                    ? item.slug
                    : typeof item.stylesheet === 'string'
                      ? item.stylesheet
                      : '';
            const name = typeof item.name === 'string' ? item.name : slug;
            const ver = typeof item.version === 'string' ? item.version : '';
            const active = item.active === true;
            out.push({
                name: name !== '' ? name : '—',
                slug: slug !== '' ? slug : '—',
                current_version: ver !== '' ? ver : '—',
                latest_version: null,
                latest_repo_updated_at: null,
                active,
                notes: fallbackNote,
            });
        }
        return out;
    }

    return base;
}

function normalizeVersionToken(v: string): string {
    return v.replace(/^v/i, '').replace(/—/g, '').trim();
}

/** Confronto versioni stile semver corto (suffissi -alpha ecc. possono risultare «unknown»). */
function compareVersionTone(current: string, latest: string | null): Exclude<WpVersionRowStatus, 'inactive'> {
    const c = normalizeVersionToken(current);
    const l = latest != null && latest !== '' ? normalizeVersionToken(latest) : '';
    if (c === '' || c === '—' || l === '' || l === '—') {
        return 'unknown';
    }
    const pa = c.split(/[.-]/).map((x) => parseInt(x, 10));
    const pb = l.split(/[.-]/).map((x) => parseInt(x, 10));
    if (pa.some((n) => Number.isNaN(n)) || pb.some((n) => Number.isNaN(n))) {
        return 'unknown';
    }
    const n = Math.max(pa.length, pb.length);
    for (let i = 0; i < n; i++) {
        const da = pa[i] ?? 0;
        const db = pb[i] ?? 0;
        if (da < db) {
            return 'outdated';
        }
        if (da > db) {
            return 'current';
        }
    }
    return 'current';
}

function rowVersionStatus(groupId: string, row: WpAuditRow): WpVersionRowStatus {
    const s = row.version_status;
    if (s === 'inactive' || s === 'current' || s === 'outdated' || s === 'unknown') {
        return s;
    }
    if (groupId === 'plugins' || groupId === 'themes') {
        if (row.active !== true) {
            return 'inactive';
        }
    }
    return compareVersionTone(row.current_version, row.latest_version);
}

function versionCellClass(status: WpVersionRowStatus): string {
    if (status === 'inactive') {
        return 'text-muted-foreground';
    }
    if (status === 'outdated') {
        return 'font-semibold text-red-600 dark:text-red-400';
    }
    if (status === 'current') {
        return 'font-semibold text-green-700 dark:text-green-400';
    }
    return 'text-muted-foreground';
}

function formatItalianDateTime(iso: string): string {
    try {
        return new Intl.DateTimeFormat('it-IT', {
            dateStyle: 'medium',
            timeStyle: 'medium',
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

export function WebDomainWordPressTab({
    domainId,
    wpVersionAudit,
    wpConnectorTokenConfigured,
    disabled,
}: {
    domainId: number;
    wpVersionAudit: WpVersionAuditPayload | null;
    wpConnectorTokenConfigured: boolean;
    disabled: boolean;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runAudit = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(route('modules.web.domini.wp-connector.version-audit', domainId), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({}),
            });
            const ctype = res.headers.get('content-type');
            if (!ctype?.includes('application/json')) {
                const text = await res.text();
                throw new Error(`Risposta non valida (${res.status}): ${text.slice(0, 160)}`);
            }
            const data = (await res.json()) as { ok?: boolean; message?: string };
            if (!res.ok || !data.ok) {
                throw new Error(data.message ?? `HTTP ${res.status}`);
            }
            router.reload({ only: ['domain'] });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Errore sconosciuto');
        } finally {
            setLoading(false);
        }
    }, [domainId]);

    const groups = Array.isArray(wpVersionAudit?.groups) ? wpVersionAudit.groups : [];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h3 className="text-sm font-semibold">Versioni WordPress</h3>
                    <p className="text-muted-foreground text-xs">
                        Confronto tra versioni rilevate sul sito (REST connettore) e ultime versioni pubblicate su WordPress.org
                        (core, temi, plugin). Il JSON completo è salvato sul dominio.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="gap-1"
                    disabled={disabled || !wpConnectorTokenConfigured || loading}
                    onClick={() => runAudit()}
                    title={
                        !wpConnectorTokenConfigured
                            ? 'Esegui prima il deploy del connettore e salva il token'
                            : undefined
                    }
                >
                    <RefreshCw className={`size-4 shrink-0 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Aggiornamento…' : 'Aggiorna da sito'}
                </Button>
            </div>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            {wpVersionAudit?.generated_at ? (
                <p className="text-muted-foreground text-xs">
                    Ultimo aggiornamento salvato:{' '}
                    <span className="font-medium text-foreground">{formatItalianDateTime(wpVersionAudit.generated_at)}</span>
                </p>
            ) : (
                <p className="text-muted-foreground text-sm">
                    Nessun dato salvato ancora. Usa &quot;Aggiorna da sito&quot; (serve connettore attivo e token configurato).
                </p>
            )}
            {Array.isArray(wpVersionAudit?.errors) && wpVersionAudit.errors.length > 0 ? (
                <ul className="text-amber-800 list-inside list-disc text-xs dark:text-amber-200">
                    {wpVersionAudit.errors.map((msg, i) => (
                        <li key={i}>{msg}</li>
                    ))}
                </ul>
            ) : null}

            {groups.map((g) => {
                const rows = rowsForGroup(g, wpVersionAudit);
                return (
                <div key={g.id} className="space-y-2">
                    <h4 className="text-sm font-medium">{g.label}</h4>
                    {rows.length === 0 ? (
                        <p className="text-muted-foreground text-xs">Nessuna voce.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead className="hidden sm:table-cell">Slug</TableHead>
                                    <TableHead>Installata</TableHead>
                                    <TableHead>Su repository</TableHead>
                                    <TableHead className="hidden lg:table-cell">Ultimo agg. repo</TableHead>
                                    <TableHead className="hidden md:table-cell">Note</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row, idx) => {
                                    const st = rowVersionStatus(g.id, row);
                                    const verClass = versionCellClass(st);
                                    const nameTone =
                                        st === 'inactive'
                                            ? 'text-muted-foreground'
                                            : st === 'outdated'
                                              ? 'text-red-600 dark:text-red-400'
                                              : st === 'current'
                                                ? 'text-green-700 dark:text-green-400'
                                                : '';
                                    return (
                                    <TableRow
                                        key={`${g.id}-${row.slug}-${idx}`}
                                        className={cn(st === 'inactive' && 'text-muted-foreground opacity-80')}
                                    >
                                        <TableCell className={cn('font-medium', nameTone)}>
                                            <span className="flex flex-wrap items-center gap-2">
                                                {row.name}
                                                {(g.id === 'plugins' && row.active) ||
                                                (g.id === 'themes' && row.active) ||
                                                (g.id === 'theme' && row.active !== false) ? (
                                                    <span className="bg-muted rounded px-1.5 py-0 text-[10px] font-normal uppercase text-foreground">
                                                        Attivo
                                                    </span>
                                                ) : null}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground hidden max-w-[10rem] truncate font-mono text-xs sm:table-cell">
                                            {row.slug}
                                        </TableCell>
                                        <TableCell className={cn('font-mono text-xs', verClass)}>{row.current_version}</TableCell>
                                        <TableCell className={cn('font-mono text-xs', verClass)}>
                                            {row.latest_version ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground hidden text-xs lg:table-cell">
                                            {row.latest_repo_updated_at
                                                ? formatItalianDateTime(row.latest_repo_updated_at)
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground hidden max-w-xs whitespace-normal text-xs md:table-cell">
                                            {row.notes ?? '—'}
                                        </TableCell>
                                    </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>
            );
            })}
        </div>
    );
}
