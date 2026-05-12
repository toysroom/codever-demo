import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

type FormFieldProps = {
    id: string;
    label: ReactNode;
    /** Mostra asterisco obbligatorio dopo l’etichetta. */
    required?: boolean;
    description?: ReactNode;
    error?: string;
    className?: string;
    children: ReactNode;
};

/** Blocco Label + contenuto + errore (composizione sopra shadcn/ui). */
export function FormField({ id, label, required, description, error, className, children }: FormFieldProps) {
    return (
        <div className={cn('grid gap-2', className)}>
            <Label htmlFor={id}>
                {label}
                {required ? <span className="text-destructive"> *</span> : null}
            </Label>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
            {children}
            <InputError message={error} />
        </div>
    );
}
