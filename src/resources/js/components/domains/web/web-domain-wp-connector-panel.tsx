import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { Plug, RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { route } from 'ziggy-js';

function csrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
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

export function WebDomainWpConnectorPanel({
    domainId,
    disabled,
    wpConnectorTokenConfigured,
}: {
    domainId: number;
    disabled: boolean;
    wpConnectorTokenConfigured: boolean;
}) {
    const [deployOpen, setDeployOpen] = useState(false);
    const [deployLoading, setDeployLoading] = useState(false);
    const [deployError, setDeployError] = useState<string | null>(null);
    const [deploySuccess, setDeploySuccess] = useState<string | null>(null);
    const [deployLoggedAt, setDeployLoggedAt] = useState<string | null>(null);
    const [regenerateToken, setRegenerateToken] = useState(false);

    const [infoOpen, setInfoOpen] = useState(false);
    const [infoLoading, setInfoLoading] = useState(false);
    const [infoError, setInfoError] = useState<string | null>(null);
    const [infoJson, setInfoJson] = useState<string | null>(null);

    const resetDeploy = () => {
        setDeployError(null);
        setDeploySuccess(null);
        setDeployLoggedAt(null);
        setRegenerateToken(false);
    };

    const runDeploy = useCallback(async () => {
        setDeployLoading(true);
        resetDeploy();
        try {
            const res = await fetch(route('modules.web.domini.wp-connector.deploy', domainId), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({ regenerate_token: regenerateToken }),
            });
            const ctype = res.headers.get('content-type');
            if (!ctype?.includes('application/json')) {
                const text = await res.text();
                throw new Error(`Risposta non valida (${res.status}): ${text.slice(0, 160)}`);
            }
            type DeployBody = {
                ok?: boolean;
                message?: string;
                plugin_path?: string;
                secret_path?: string;
                deploy_logged_at?: string;
            };
            const data = (await res.json()) as DeployBody;
            const loggedIso = data.deploy_logged_at ?? null;

            if (!res.ok || !data.ok) {
                const err = new Error(data.message ?? `HTTP ${res.status}`) as Error & { deployLoggedAt?: string };
                if (loggedIso) {
                    err.deployLoggedAt = loggedIso;
                }
                throw err;
            }

            const paths = [data.plugin_path, data.secret_path].filter(Boolean).join(' — ');
            setDeploySuccess(paths ? `${data.message ?? 'OK'} — ${paths}` : (data.message ?? 'Deploy completato.'));
            setDeployLoggedAt(loggedIso);
            router.reload({ only: ['domain'] });
        } catch (e) {
            const enriched = e as Error & { deployLoggedAt?: string };
            setDeployError(e instanceof Error ? e.message : 'Errore sconosciuto');
            setDeployLoggedAt(enriched.deployLoggedAt ?? null);
        } finally {
            setDeployLoading(false);
        }
    }, [domainId, regenerateToken]);

    const resetInfo = () => {
        setInfoError(null);
        setInfoJson(null);
    };

    const runSiteInfo = useCallback(async () => {
        setInfoLoading(true);
        resetInfo();
        try {
            const res = await fetch(route('modules.web.domini.wp-connector.site-info', domainId), {
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
            const data: unknown = await res.json();
            if (!res.ok) {
                const msg =
                    typeof data === 'object' && data !== null && 'message' in data && typeof (data as { message: unknown }).message === 'string'
                        ? (data as { message: string }).message
                        : `HTTP ${res.status}`;
                throw new Error(msg);
            }
            setInfoJson(JSON.stringify(data, null, 2));
        } catch (e) {
            setInfoError(e instanceof Error ? e.message : 'Errore sconosciuto');
        } finally {
            setInfoLoading(false);
        }
    }, [domainId]);

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Dialog
                open={deployOpen}
                onOpenChange={(next) => {
                    setDeployOpen(next);
                    if (!next) {
                        resetDeploy();
                    }
                }}
            >
                <DialogTrigger asChild>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="gap-1"
                        disabled={disabled}
                        title={disabled ? 'Aggiungi almeno un account FTP dalla pagina Modifica' : undefined}
                    >
                        <Plug className="size-4 shrink-0" />
                        Deploy connettore WP
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Deploy Zelante Connector</DialogTitle>
                        <DialogDescription className="space-y-3 text-start">
                            <span className="block">
                                Carica il plugin in{' '}
                                <code className="bg-muted rounded px-1 py-0.5 text-xs">wp-content/plugins/zelante-connector/</code> e il file
                                secret condiviso con il CRM. Attiva il plugin in WordPress se necessario.
                            </span>
                            <span className="text-muted-foreground block text-xs">
                                Il token è salvato in Zelante (crittografato) e non viene mostrato in interfaccia. Ogni deploy viene registrato
                                nell&apos;archivio FTP.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        {wpConnectorTokenConfigured ? (
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="regen-wp-token"
                                    checked={regenerateToken}
                                    onCheckedChange={(v) => setRegenerateToken(v === true)}
                                />
                                <Label htmlFor="regen-wp-token" className="cursor-pointer text-sm font-normal">
                                    Rigenera token e aggiorna il file sul server
                                </Label>
                            </div>
                        ) : null}
                        <Button type="button" size="sm" onClick={() => runDeploy()} disabled={deployLoading}>
                            {deployLoading ? 'Deploy…' : deploySuccess ? 'Ripeti deploy' : 'Avvia deploy'}
                        </Button>
                        {deployError ? <p className="text-destructive text-sm">{deployError}</p> : null}
                        {deployError && deployLoggedAt ? (
                            <p className="text-muted-foreground text-xs">
                                Tentativo registrato:{' '}
                                <span className="font-medium text-foreground">{formatItalianDateTime(deployLoggedAt)}</span>.
                            </p>
                        ) : null}
                        {deploySuccess ? (
                            <div className="space-y-2">
                                <p className="text-green-700 text-sm dark:text-green-400">{deploySuccess}</p>
                                {deployLoggedAt ? (
                                    <p className="text-muted-foreground text-xs">
                                        Registrato:{' '}
                                        <span className="font-medium text-foreground">{formatItalianDateTime(deployLoggedAt)}</span>.
                                    </p>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" size="sm" onClick={() => setDeployOpen(false)} disabled={deployLoading}>
                            Chiudi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={infoOpen}
                onOpenChange={(next) => {
                    setInfoOpen(next);
                    if (!next) {
                        resetInfo();
                    }
                }}
            >
                <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="gap-1" disabled={!wpConnectorTokenConfigured}>
                        <RefreshCw className="size-4 shrink-0" />
                        Info sito (REST)
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Informazioni sito WordPress</DialogTitle>
                        <DialogDescription className="text-start">
                            Chiama l&apos;endpoint REST del plugin con il token salvato sul dominio (nessun token in chiaro in questa
                            schermata).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3">
                        <Button type="button" size="sm" onClick={() => runSiteInfo()} disabled={infoLoading}>
                            {infoLoading ? 'Richiesta…' : infoJson ? 'Aggiorna' : 'Carica'}
                        </Button>
                        {infoError ? <p className="text-destructive text-sm">{infoError}</p> : null}
                        {infoJson ? (
                            <pre className="bg-muted max-h-80 overflow-auto rounded-md p-3 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap">
                                {infoJson}
                            </pre>
                        ) : null}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" size="sm" onClick={() => setInfoOpen(false)} disabled={infoLoading}>
                            Chiudi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
