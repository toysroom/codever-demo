import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { PackageSearch } from 'lucide-react';
import { useCallback, useState } from 'react';
import { route } from 'ziggy-js';

function csrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

type CheckBody = {
    ok?: boolean;
    plugin_active?: boolean | null;
    message?: string;
    discovery_url?: string;
};

export function WebDomainWpConnectorPluginCheckButton({
    domainId,
    disabled = false,
}: {
    domainId: number;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<CheckBody | null>(null);

    const reset = () => {
        setError(null);
        setResult(null);
    };

    const runCheck = useCallback(async () => {
        setLoading(true);
        reset();
        try {
            const res = await fetch(route('modules.web.domini.wp-connector.plugin-check', domainId), {
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
            const data = (await res.json()) as CheckBody;
            if (!res.ok || !data.ok) {
                throw new Error(data.message ?? `HTTP ${res.status}`);
            }
            setResult(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Errore sconosciuto');
        } finally {
            setLoading(false);
        }
    }, [domainId]);

    const activeLabel =
        result?.plugin_active === true ? 'Attivo' : result?.plugin_active === false ? 'Non attivo / assente' : null;

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) {
                    reset();
                }
            }}
        >
            <DialogTrigger asChild>
                <Button type="button" variant="secondary" size="sm" className="gap-1" disabled={disabled}>
                    <PackageSearch className="size-4 shrink-0" />
                    Verifica plugin WP
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Verifica Zelante Connector</DialogTitle>
                    <DialogDescription className="text-start">
                        Controlla l&apos;indice pubblico <code className="bg-muted rounded px-1 py-0.5 text-xs">/wp-json/</code>: se il
                        namespace <code className="bg-muted rounded px-1 py-0.5 text-xs">zelante/v1</code> è registrato, il plugin è
                        caricato da WordPress come attivo (stessa regola dell&apos;admin REST).
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                    <Button type="button" size="sm" onClick={() => runCheck()} disabled={loading}>
                        {loading ? 'Verifica in corso…' : result ? 'Ripeti verifica' : 'Esegui verifica'}
                    </Button>
                    {error ? <p className="text-destructive text-sm">{error}</p> : null}
                    {result ? (
                        <div className="space-y-2 text-sm">
                            {activeLabel ? (
                                <p>
                                    <span className="text-muted-foreground">Esito: </span>
                                    <span className={result.plugin_active ? 'text-green-700 dark:text-green-400' : 'font-medium'}>
                                        {activeLabel}
                                    </span>
                                </p>
                            ) : null}
                            <p className="text-muted-foreground leading-relaxed">{result.message}</p>
                            {result.discovery_url ? (
                                <p className="text-muted-foreground break-all text-xs">
                                    URL usato: <span className="font-mono text-foreground">{result.discovery_url}</span>
                                </p>
                            ) : null}
                        </div>
                    ) : null}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
                        Chiudi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
