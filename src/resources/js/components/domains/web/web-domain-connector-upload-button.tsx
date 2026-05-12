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
import { Upload } from 'lucide-react';
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

export function WebDomainConnectorUploadButton({
    domainId,
    disabled,
}: {
    domainId: number;
    disabled: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successText, setSuccessText] = useState<string | null>(null);
    const [loggedAtHint, setLoggedAtHint] = useState<string | null>(null);

    const reset = () => {
        setError(null);
        setSuccessText(null);
        setLoggedAtHint(null);
    };

    const runUpload = useCallback(async () => {
        setLoading(true);
        reset();
        try {
            const res = await fetch(route('modules.web.domini.ftp-upload-connector-test', domainId), {
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
            type ApiBody = {
                ok?: boolean;
                message?: string;
                remote_path?: string;
                test_logged_at?: string;
            };
            const data = (await res.json()) as ApiBody;
            const loggedIso = data.test_logged_at ?? null;

            if (!res.ok || !data.ok) {
                const err = new Error(data.message ?? `HTTP ${res.status}`) as Error & { testLoggedAt?: string };
                if (loggedIso) {
                    err.testLoggedAt = loggedIso;
                }
                throw err;
            }

            const path = data.remote_path ?? '';
            setSuccessText(path ? `${data.message ?? 'OK'} — ${path}` : (data.message ?? 'Upload completato.'));
            setLoggedAtHint(loggedIso);
        } catch (e) {
            const enriched = e as Error & { testLoggedAt?: string };
            setError(e instanceof Error ? e.message : 'Errore sconosciuto');
            setLoggedAtHint(enriched.testLoggedAt ?? null);
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
                    reset();
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
                    <Upload className="size-4 shrink-0" />
                    Upload test connector
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload file di test (zelante-connector)</DialogTitle>
                    <DialogDescription className="space-y-3 text-start">
                        <span className="block">
                            Viene creato il file{' '}
                            <code className="bg-muted rounded px-1 py-0.5 text-xs">
                                wp-content/plugins/zelante-connector/.zelante-connection-test.txt
                            </code>{' '}
                            usando l’account FTP predefinito (o l’unico configurato). Serve per verificare permessi e
                            percorso root WordPress.
                        </span>
                        <span className="text-muted-foreground block text-xs">
                            Ogni tentativo viene registrato in archivio (data/ora per l’account usato nel test).
                        </span>
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                    <Button type="button" size="sm" onClick={() => runUpload()} disabled={loading}>
                        {loading ? 'Upload…' : successText ? 'Ripeti upload' : 'Avvia upload'}
                    </Button>
                    {error ? <p className="text-destructive text-sm">{error}</p> : null}
                    {error && loggedAtHint ? (
                        <p className="text-muted-foreground text-xs">
                            Tentativo registrato nell&apos;archivio FTP:{' '}
                            <span className="font-medium text-foreground">{formatItalianDateTime(loggedAtHint)}</span>.
                        </p>
                    ) : null}
                    {successText ? (
                        <div className="space-y-2">
                            <p className="text-green-700 text-sm dark:text-green-400">{successText}</p>
                            {loggedAtHint ? (
                                <p className="text-muted-foreground text-xs">
                                    Salvato nell&apos;archivio FTP:{' '}
                                    <span className="font-medium text-foreground">
                                        {formatItalianDateTime(loggedAtHint)}
                                    </span>
                                    .
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
