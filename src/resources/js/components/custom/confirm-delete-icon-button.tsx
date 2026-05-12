import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';

type ConfirmDeleteIconButtonProps = {
    onConfirm: () => void;
    disabled?: boolean;
    className?: string;
    /** Nome record mostrato nel testo di conferma (opzionale). */
    entityLabel?: string;
    title?: string;
    /** Se omesso, viene generato da entityLabel. */
    description?: ReactNode;
    confirmText?: string;
    cancelText?: string;
};

export function ConfirmDeleteIconButton({
    onConfirm,
    disabled = false,
    className,
    entityLabel,
    title = 'Conferma eliminazione',
    description,
    confirmText = 'Elimina',
    cancelText = 'Annulla',
}: ConfirmDeleteIconButtonProps) {
    const [open, setOpen] = useState(false);

    const defaultDescription =
        entityLabel != null && entityLabel !== '' ? (
            <>
                Eliminare definitivamente <strong className="text-foreground">{entityLabel}</strong>? L&apos;operazione non
                può essere annullata.
            </>
        ) : (
            <>Eliminare definitivamente questo record? L&apos;operazione non può essere annullata.</>
        );

    const handleConfirm = () => {
        onConfirm();
        setOpen(false);
    };

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        className={cn(
                            'bg-red-500/15 text-red-700 hover:bg-red-500/25 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300',
                            className,
                        )}
                        onClick={() => setOpen(true)}
                        aria-haspopup="dialog"
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Elimina</p>
                </TooltipContent>
            </Tooltip>

            <Dialog open={open} onOpenChange={(next) => !next && setOpen(false)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription className="text-left text-sm text-muted-foreground">
                            {description ?? defaultDescription}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            {cancelText}
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleConfirm}>
                            {confirmText}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
