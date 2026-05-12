import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ScanSearch } from 'lucide-react';
import { useCallback, useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';

export interface SiteProbeFrameworkHint {
    name: string;
    confidence: string;
    clues: string[];
}

export interface SiteProbeResult {
    hostname: string;
    resolved_ips: string[];
    scheme_used: string | null;
    final_url: string | null;
    status_code: number | null;
    reachable: boolean;
    error_message: string | null;
    duration_ms: number;
    content_type: string | null;
    charset: string | null;
    title: string | null;
    server_header: string | null;
    powered_by_headers: string[];
    redirect_count: number;
    redirect_chain: { status?: number | null; location?: string | null }[];
    framework_hints: SiteProbeFrameworkHint[];
}

function csrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

function statusBadgeTone(code: number | null): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (code === null) {
        return 'secondary';
    }
    if (code >= 200 && code < 400) {
        return 'default';
    }
    if (code >= 400 && code < 500) {
        return 'outline';
    }
    return 'destructive';
}

export function WebDomainProbeButton({ domainId, hostname }: { domainId: number; hostname: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SiteProbeResult | null>(null);

    const runDetect = useCallback(async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await fetch(route('modules.web.domini.detect', domainId), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
            });
            const ctype = res.headers.get('content-type');
            if (!ctype?.includes('application/json')) {
                const text = await res.text();
                throw new Error(`Risposta non valida (${res.status}): ${text.slice(0, 120)}`);
            }
            const data = (await res.json()) as SiteProbeResult & { message?: string };
            if (!res.ok) {
                throw new Error(
                    typeof data.error_message === 'string'
                        ? data.error_message
                        : typeof data.message === 'string'
                          ? res.status === 403
                              ? `${data.message} (per salvare la scansione serve il permesso di modifica domini).`
                              : data.message
                          : `HTTP ${res.status}`,
                );
            }
            setResult(data);
            router.reload({ preserveScroll: true });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Errore sconosciuto');
        } finally {
            setLoading(false);
        }
    }, [domainId]);

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) {
                    setError(null);
                    setResult(null);
                }
            }}
        >
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-1">
                    <ScanSearch className="size-4 shrink-0" />
                    Detect
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
                <DialogHeader className="border-b px-6 py-4 text-left">
                    <DialogTitle className="font-mono text-base">Analisi: {hostname}</DialogTitle>
                    <DialogDescription>
                        Controllo dalla rete pubblica dell’host (solo IPv4 pubblici). Il rilevamento stack è indicativo,
                        basato su header e sugli snippet HTML restituiti. I risultati vengono salvati sul dominio (serve il
                        permesso di modifica).
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 border-b px-6 py-3">
                    <Button type="button" size="sm" onClick={() => runDetect()} disabled={loading}>
                        {loading ? 'Acquisizione…' : result || error ? 'Ripeti scansione' : 'Avvia scansione'}
                    </Button>
                </div>
                <div className="max-h-[calc(90vh-10rem)] overflow-y-auto px-6 py-4">
                    {error ? (
                        <p className="text-destructive text-sm">{error}</p>
                    ) : null}
                    {result ? (
                        <div className="flex flex-col gap-4 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-muted-foreground">Stato HTTP</span>
                                <Badge variant={statusBadgeTone(result.status_code)}>
                                    {result.status_code ?? '—'}
                                </Badge>
                                {result.scheme_used ? (
                                    <Badge variant="secondary">{result.scheme_used.toUpperCase()}</Badge>
                                ) : null}
                                <span className="text-muted-foreground ml-auto">{result.duration_ms} ms</span>
                            </div>
                            <div className="text-muted-foreground space-y-1">
                                <div>
                                    <span className="font-medium text-foreground">Raggiungibile: </span>
                                    {result.reachable ? 'sì' : 'no'}
                                </div>
                                {result.final_url ? (
                                    <div className="break-all font-mono text-xs">
                                        <span className="font-medium text-foreground">URL finale: </span>
                                        {result.final_url}
                                    </div>
                                ) : null}
                                {result.error_message ? (
                                    <div className="text-amber-800 dark:text-amber-400">{result.error_message}</div>
                                ) : null}
                                {result.resolved_ips?.length ? (
                                    <div className="font-mono text-xs">
                                        IPv4 pubblici risolti: {result.resolved_ips.join(', ')}
                                    </div>
                                ) : null}
                            </div>
                            {result.title ? (
                                <div>
                                    <div className="text-muted-foreground mb-0.5 text-xs font-medium uppercase">
                                        Titolo pagina
                                    </div>
                                    <div className="font-medium">{result.title}</div>
                                </div>
                            ) : null}
                            <div className="grid gap-1 text-xs">
                                {result.server_header ? (
                                    <div>
                                        <span className="text-muted-foreground">Server: </span>
                                        <span className="font-mono">{result.server_header}</span>
                                    </div>
                                ) : null}
                                {result.powered_by_headers?.length ? (
                                    <div>
                                        <span className="text-muted-foreground">X-Powered-By: </span>
                                        <span className="font-mono">{result.powered_by_headers.join(' · ')}</span>
                                    </div>
                                ) : null}
                                {result.content_type ? (
                                    <div>
                                        <span className="text-muted-foreground">Content-Type: </span>
                                        <span className="font-mono">
                                            {result.content_type}
                                            {result.charset ? `; ${result.charset}` : ''}
                                        </span>
                                    </div>
                                ) : null}
                            </div>
                            {result.redirect_chain?.length ? (
                                <div>
                                    <div className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                                        Redirect ({result.redirect_count})
                                    </div>
                                    <ul className="list-inside list-disc font-mono text-xs">
                                        {result.redirect_chain.map((r, i) => (
                                            <li key={i}>
                                                {r.status ?? '—'} → {r.location ?? '—'}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                            <div>
                                <div className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                                    Stack (euristico)
                                </div>
                                <ul className="space-y-2">
                                    {result.framework_hints.map((h, i) => (
                                        <li
                                            key={i}
                                            className="border-border/80 bg-muted/30 rounded-md border px-3 py-2"
                                        >
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-medium">{h.name}</span>
                                                <Badge variant="outline" className="text-[10px] uppercase">
                                                    {h.confidence}
                                                </Badge>
                                            </div>
                                            {h.clues?.length ? (
                                                <ul className="text-muted-foreground mt-1 list-inside list-disc text-xs">
                                                    {h.clues.map((c, j) => (
                                                        <li key={j}>{c}</li>
                                                    ))}
                                                </ul>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : !loading && !error ? (
                        <p className="text-muted-foreground text-sm">Premi «Avvia scansione» per interrogare il sito.</p>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
