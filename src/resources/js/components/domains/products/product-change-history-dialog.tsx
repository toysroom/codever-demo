import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { History, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface ProductChangeHistoryEntry {
    id: number;
    occurred_at: string;
    summary: string;
    actor: string | null;
    changes: { label: string; before: string | null; after: string | null }[];
}

type ProductChangeHistoryDialogBaseProps = {
    disabled?: boolean;
    triggerClassName?: string;
};

type ProductChangeHistoryDialogStaticProps = ProductChangeHistoryDialogBaseProps & {
    entries: ProductChangeHistoryEntry[];
    fetchUrl?: undefined;
};

type ProductChangeHistoryDialogFetchProps = ProductChangeHistoryDialogBaseProps & {
    entries?: undefined;
    fetchUrl: string;
};

export type ProductChangeHistoryDialogProps = ProductChangeHistoryDialogStaticProps | ProductChangeHistoryDialogFetchProps;

function formatWhen(iso: string): string {
    try {
        const d = new Date(iso);

        return new Intl.DateTimeFormat('it-IT', {
            dateStyle: 'short',
            timeStyle: 'short',
        }).format(d);
    } catch {
        return iso;
    }
}

function HistoryEntriesList({ entries }: { entries: ProductChangeHistoryEntry[] }) {
    const sorted = useMemo(
        () => [...entries].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()),
        [entries],
    );

    if (entries.length === 0) {
        return <p className="text-muted-foreground text-sm">Nessuna modifica registrata finora.</p>;
    }

    return (
        <ul className="flex flex-col gap-4">
            {sorted.map((row) => (
                <li key={row.id} className="rounded-lg border border-border bg-card/40 p-3 text-sm shadow-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium">{row.summary}</span>
                        <time className="text-muted-foreground text-xs" dateTime={row.occurred_at}>
                            {formatWhen(row.occurred_at)}
                        </time>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                        {row.actor ? <>Utente: {row.actor}</> : <>Utente: —</>}
                    </p>
                    {row.changes.length === 0 ? (
                        <p className="text-muted-foreground mt-2 text-xs">Nessun dettaglio sui campi.</p>
                    ) : (
                        <div className="mt-3 overflow-x-auto rounded-md border border-border/60">
                            <table className="w-full min-w-[280px] text-left text-xs">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-2 py-1.5 font-medium">Campo</th>
                                        <th className="px-2 py-1.5 font-medium">Prima</th>
                                        <th className="px-2 py-1.5 font-medium">Dopo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {row.changes.map((c, idx) => (
                                        <tr key={`${row.id}-${idx}`} className="border-t border-border/50">
                                            <td className="px-2 py-1.5 align-top">{c.label}</td>
                                            <td className="text-muted-foreground max-w-[140px] px-2 py-1.5 align-top break-words whitespace-pre-wrap">
                                                {c.before ?? '—'}
                                            </td>
                                            <td className="max-w-[140px] px-2 py-1.5 align-top break-words font-medium whitespace-pre-wrap">
                                                {c.after ?? '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
}

export function ProductChangeHistoryDialog(props: ProductChangeHistoryDialogProps) {
    const { disabled, triggerClassName } = props;
    const isFetchMode = 'fetchUrl' in props && props.fetchUrl !== undefined;
    const fetchUrl = isFetchMode ? props.fetchUrl : undefined;
    const staticEntries = !isFetchMode && 'entries' in props ? props.entries : undefined;

    const [open, setOpen] = useState(false);
    const [fetchedEntries, setFetchedEntries] = useState<ProductChangeHistoryEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        if (!isFetchMode || !fetchUrl) {
            return;
        }
        setFetchedEntries([]);
        setFetchError(null);
        setLoading(false);
    }, [isFetchMode, fetchUrl]);

    const load = useCallback(async () => {
        if (!fetchUrl) {
            return;
        }
        setLoading(true);
        setFetchError(null);
        try {
            const res = await fetch(fetchUrl, {
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const data = (await res.json()) as { entries?: ProductChangeHistoryEntry[] };
            setFetchedEntries(Array.isArray(data.entries) ? data.entries : []);
        } catch {
            setFetchError('Impossibile caricare lo storico.');
        } finally {
            setLoading(false);
        }
    }, [fetchUrl]);

    useEffect(() => {
        if (!open || !isFetchMode || !fetchUrl) {
            return;
        }
        void load();
    }, [open, isFetchMode, fetchUrl, load]);

    const displayEntries = isFetchMode ? fetchedEntries : (staticEntries ?? []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className={disabled ? 'inline-flex cursor-not-allowed' : 'inline-flex'}>
                        <DialogTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={disabled}
                                className={cn(
                                    'bg-violet-500/15 text-violet-900 hover:bg-violet-500/25 dark:text-violet-200',
                                    triggerClassName,
                                )}
                                aria-label="Storico modifiche"
                            >
                                <History className="size-4" />
                            </Button>
                        </DialogTrigger>
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Storico modifiche</p>
                </TooltipContent>
            </Tooltip>
            <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 p-0 sm:max-w-xl">
                <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
                    <DialogTitle>Storico modifiche</DialogTitle>
                    <DialogDescription>
                        Cronologia delle modifiche a questo prodotto (campi anagrafici e prezzi per listino).
                    </DialogDescription>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                    {isFetchMode && loading ? (
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                            <Loader2 className="size-4 animate-spin" />
                            Caricamento…
                        </div>
                    ) : isFetchMode && fetchError ? (
                        <p className="text-destructive text-sm">{fetchError}</p>
                    ) : (
                        <HistoryEntriesList entries={displayEntries} />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
