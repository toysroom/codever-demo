import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

export type EmailNotificationsClearAllMode = 'logs' | 'inbox';

export function EmailNotificationsClearAllButton({
    mode,
    disabled,
}: {
    mode: EmailNotificationsClearAllMode;
    disabled: boolean;
}) {
    const page = usePage<SharedData>();
    const t = page.props.ui?.email_notifications_tabs;
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const isLogs = mode === 'logs';
    const title = isLogs ? (t?.clear_all_logs_title ?? 'Svuota log invii') : (t?.clear_all_inbox_title ?? 'Svuota notifiche');
    const description = isLogs
        ? (t?.clear_all_logs_description ?? 'Verranno eliminati tutti i log delle comunicazioni collegate alle tue cancellazioni. L’operazione non è annullabile.')
        : (t?.clear_all_inbox_description ??
              'Verranno eliminate tutte le notifiche in app del tuo account. L’operazione non è annullabile.');
    const buttonLabel = isLogs ? (t?.clear_all_logs_button ?? 'Cancella tutti i log') : (t?.clear_all_inbox_button ?? 'Cancella tutte le notifiche');
    const confirmLabel = t?.clear_all_confirm ?? 'Elimina tutto';
    const cancelLabel = t?.clear_all_cancel ?? 'Annulla';

    const submit = () => {
        const url = isLogs ? route('email-notifications.logs.destroy-all') : route('notifications.destroy-all');
        setProcessing(true);
        router.post(
            url,
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setOpen(false);
                },
            },
        );
    };

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || processing}
                className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setOpen(true)}
            >
                {processing ? <Loader2 className="size-4 shrink-0 animate-spin" /> : <Trash2 className="size-4 shrink-0" />}
                <span className="hidden sm:inline">{buttonLabel}</span>
                <span className="sm:hidden">{isLogs ? (t?.clear_all_logs_button_short ?? 'Log') : (t?.clear_all_inbox_button_short ?? 'Notifiche')}</span>
            </Button>

            <Dialog open={open} onOpenChange={(next) => !next && setOpen(false)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription className="text-left text-sm text-muted-foreground">{description}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={processing}>
                            {cancelLabel}
                        </Button>
                        <Button type="button" variant="destructive" onClick={submit} disabled={processing}>
                            {processing ? <Loader2 className="size-4 animate-spin" /> : confirmLabel}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
