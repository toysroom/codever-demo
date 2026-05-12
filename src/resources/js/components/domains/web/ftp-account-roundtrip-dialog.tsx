import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FlaskConical } from 'lucide-react';
import { useCallback, useState } from 'react';
import { route } from 'ziggy-js';

function formatItalianDateTime(iso: string): string {
    try {
        return new Intl.DateTimeFormat('it-IT', {
            dateStyle: 'medium',
            timeStyle: 'medium',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

function csrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

type ApiOk = {
    ok: true;
    remote_path?: string;
    message?: string;
    preview?: string | null;
    preview_truncated?: boolean;
    test_logged_at?: string;
};
type ApiErr = { ok?: false; message?: string; test_logged_at?: string };

export function FtpAccountRoundtripDialog({
    domainId,
    ftpAccountId,
    ftpLabel,
    canRunTest,
}: {
    domainId: number;
    ftpAccountId?: number | null;
    ftpLabel?: string;
    /** False per nuove righe senza salvataggio DB o campi incompleti. */
    canRunTest: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<ApiOk | null>(null);
    const [loggedAtHint, setLoggedAtHint] = useState<string | null>(null);

    const resetMessages = () => {
        setError(null);
        setSuccess(null);
        setLoggedAtHint(null);
    };

    const runTest = useCallback(async () => {
        if (ftpAccountId == null) return;
        setLoading(true);
        resetMessages();
        try {
            const res = await fetch(route('modules.web.domini.ftp-roundtrip-txt-test', domainId), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({ ftp_account_id: ftpAccountId }),
            });
            const ctype = res.headers.get('content-type');
            if (!ctype?.includes('application/json')) {
                const text = await res.text();
                throw new Error(`Risposta non valida (${res.status}): ${text.slice(0, 160)}`);
            }
            const data = (await res.json()) as ApiOk & ApiErr;
            if (!res.ok || !data.ok) {
                const err = new Error((data as ApiErr).message ?? `HTTP ${res.status}`) as Error & {
                    testLoggedAt?: string;
                };
                if ((data as ApiErr).test_logged_at != null && (data as ApiErr).test_logged_at !== '') {
                    err.testLoggedAt = (data as ApiErr).test_logged_at;
                }
                throw err;
            }
            setSuccess(data as ApiOk);
        } catch (e) {
            const enriched = e as Error & { testLoggedAt?: string };
            setError(e instanceof Error ? e.message : 'Errore sconosciuto');
            setLoggedAtHint(enriched.testLoggedAt ?? null);
        } finally {
            setLoading(false);
        }
    }, [domainId, ftpAccountId]);

    const title = ftpLabel?.trim() ? `Test FTP — ${ftpLabel.trim()}` : 'Test connessione FTP';

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) {
                    resetMessages();
                }
            }}
        >
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={!canRunTest}
                title={
                    !canRunTest ? 'Serve un account già salvato e host, utente con password configurata sul server.' : undefined
                }
                onClick={() => setOpen(true)}
            >
                <FlaskConical className="size-4 shrink-0" />
                Test connessione
            </Button>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="space-y-3 text-start">
                        <span className="block">
                            Sul server viene creato un file temporaneo{' '}
                            <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
                                wp-content/zelante-roundtrip-*.txt
                            </code>{' '}
                            nella root WordPress; l&apos;app tenta lettura confrontando il contenuto e poi rimuove il file.
                        </span>
                        <span className="text-muted-foreground block text-xs">
                            Il test usa le credenziali{' '}
                            <span className="font-medium text-foreground">già salvate nel database</span>. Se hai cambiato
                            host o percorsi nel modulo ma non hai salvato, esegui prima &quot;Salva&quot;.
                        </span>
                        <span className="text-muted-foreground block text-xs">
                            Ogni tentativo (riuscito o fallito) viene registrato nel database con data e ora, legato a
                            questo account FTP.
                        </span>
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                    {error ? <p className="text-destructive text-sm">{error}</p> : null}
                    {error && loggedAtHint ? (
                        <p className="text-muted-foreground text-xs">
                            Tentativo registrato nell&apos;archivio FTP:{' '}
                            <span className="font-medium text-foreground">
                                {formatItalianDateTime(loggedAtHint)}
                            </span>
                            .
                        </p>
                    ) : null}
                    {success ? (
                        <div className="space-y-1 text-sm text-green-700 dark:text-green-400">
                            <p>{success.message ?? 'Test riuscito.'}</p>
                            {success.remote_path ? (
                                <p className="text-muted-foreground font-mono text-xs">
                                    Percorso: {success.remote_path}
                                </p>
                            ) : null}
                            {success.preview ? (
                                <p className="text-muted-foreground text-xs whitespace-pre-wrap break-words">
                                    Contenuto letto dall&apos;host (anteprima): {success.preview}
                                    {success.preview_truncated ? '…' : ''}
                                </p>
                            ) : null}
                            {success.test_logged_at ? (
                                <p className="text-muted-foreground mt-2 border-t border-sidebar-border/60 pt-2 text-xs dark:border-sidebar-border">
                                    Salvato nell&apos;archivio FTP:{' '}
                                    <span className="font-medium text-foreground">
                                        {formatItalianDateTime(success.test_logged_at)}
                                    </span>
                                    .
                                </p>
                            ) : null}
                        </div>
                    ) : null}
                </div>
                <DialogFooter className="gap-2 sm:justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                    >
                        {success ? 'Chiudi' : error && loggedAtHint ? 'Chiudi' : 'Annulla'}
                    </Button>
                    <Button type="button" variant="default" size="sm" onClick={() => runTest()} disabled={loading}>
                        {loading ? 'Test in corso…' : success ? 'Ripeti test' : 'Conferma e avvia'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
