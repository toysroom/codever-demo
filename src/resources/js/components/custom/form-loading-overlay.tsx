import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export function FormLoadingOverlay({ open, message }: { open: boolean; message?: string }) {
    if (!open) {
        return null;
    }

    return (
        <div
            className={cn(
                'fixed inset-0 z-[200] flex flex-col items-center justify-center gap-3',
                'bg-background/70 backdrop-blur-sm',
            )}
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <Spinner className="size-10" />
            {message ? <p className="text-muted-foreground max-w-sm px-4 text-center text-sm">{message}</p> : null}
        </div>
    );
}
