import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function useFlashMessages(): void {
    const { flash } = usePage<{
        flash?: { success?: string | null; error?: string | null; warning?: string | null };
    }>().props;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.warning) {
            toast.warning(flash.warning);
        }
    }, [flash?.success, flash?.error, flash?.warning]);
}
