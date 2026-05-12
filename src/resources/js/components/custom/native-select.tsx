import { cn } from '@/lib/utils';
import { forwardRef, type SelectHTMLAttributes } from 'react';

export const NATIVE_SELECT_CLASSNAME =
    'border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30';

export type NativeSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
    /** Classi aggiuntive sul `<select>`. */
    selectClassName?: string;
};

/** `<select>` nativo con stile allineato a shadcn Input (moduli CRM). */
export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(function NativeSelect(
    { className, selectClassName, children, ...props },
    ref,
) {
    return (
        <select ref={ref} className={cn(NATIVE_SELECT_CLASSNAME, selectClassName, className)} {...props}>
            {children}
        </select>
    );
});
