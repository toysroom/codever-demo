import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Eye, Pencil, Power, Search, Trash2 } from 'lucide-react';
import { forwardRef, type ComponentProps, type FormEventHandler, type ReactNode, type Ref } from 'react';
import InputError from '@/components/input-error';

export const pageSearchFiltersPanelClassName =
    'rounded-lg border border-border bg-card/60 p-4 shadow-sm backdrop-blur-sm';

export function PageActions({ children }: { children: ReactNode }) {
    return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function PageHeaderActions({ children }: { children: ReactNode }) {
    return <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">{children}</div>;
}

export function SearchInput({
    value,
    onSearch,
    placeholder,
    className,
}: {
    value: string;
    onSearch: (value: string) => void;
    placeholder?: string;
    className?: string;
}) {
    return (
        <div className={cn('relative', className)}>
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
                value={value}
                onChange={(e) => onSearch(e.target.value)}
                placeholder={placeholder}
                className="pl-9"
            />
        </div>
    );
}

export function CreateButton({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Button asChild>
            <Link href={href}>{children}</Link>
        </Button>
    );
}

export function ExportButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
    return (
        <Button type="button" variant="outline" onClick={onClick} disabled={disabled}>
            Export
        </Button>
    );
}

export function ViewButton({ href }: { href: string; entityName?: string }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="bg-sky-500/15 text-sky-800 hover:bg-sky-500/25 dark:text-sky-300"
                >
                    <Link href={href}>
                        <Eye className="size-4" />
                    </Link>
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Visualizza</p>
            </TooltipContent>
        </Tooltip>
    );
}

export function EditButton({ href }: { href: string; entityName?: string }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="bg-amber-500/15 text-amber-900 hover:bg-amber-500/25 dark:text-amber-200"
                >
                    <Link href={href}>
                        <Pencil className="size-4" />
                    </Link>
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Modifica</p>
            </TooltipContent>
        </Tooltip>
    );
}

export function DeleteButton({
    onClick,
    disabled,
    className,
}: {
    onClick: () => void;
    entityName?: string;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                        'bg-red-500/15 text-red-700 hover:bg-red-500/25 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300',
                        className,
                    )}
                    onClick={onClick}
                    disabled={disabled}
                >
                    <Trash2 className="size-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Elimina</p>
            </TooltipContent>
        </Tooltip>
    );
}

export function ToggleActiveButton({
    isActive,
    onClick,
    disabled,
    disabledTooltip,
}: {
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
    disabledTooltip?: string;
}) {
    const label = disabled
        ? (disabledTooltip ?? 'Azione non disponibile')
        : isActive
          ? 'Disattiva record'
          : 'Attiva record';

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className={disabled ? 'inline-flex cursor-not-allowed' : 'inline-flex'}>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        className={cn(
                            'disabled:opacity-50',
                            isActive
                                ? 'bg-emerald-500/15 text-emerald-800 hover:bg-emerald-500/25 dark:text-emerald-300'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80',
                        )}
                        onClick={() => {
                            if (!disabled) {
                                onClick();
                            }
                        }}
                    >
                        <Power className="size-4" />
                    </Button>
                </span>
            </TooltipTrigger>
            <TooltipContent>
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    );
}

export function DisabledDeleteButton({ tooltip }: { tooltip: string }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="inline-flex cursor-not-allowed">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled
                        className="bg-red-500/10 opacity-50"
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </span>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    );
}

export function BackButton({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Button asChild variant="outline">
            <Link href={href}>{children}</Link>
        </Button>
    );
}

export function CancelButton({ href, children }: { href: string; children?: ReactNode }) {
    return (
        <Button asChild variant="outline" type="button">
            <Link href={href}>{children ?? 'Cancel'}</Link>
        </Button>
    );
}

export function SaveButton({
    processing,
    isLoading,
    loadingText,
    defaultText,
    children,
    disabled,
    ...props
}: ComponentProps<typeof Button> & {
    processing?: boolean;
    isLoading?: boolean;
    loadingText?: string;
    defaultText?: string;
}) {
    const busy = Boolean(isLoading ?? processing);

    return (
        <Button type="submit" disabled={disabled || busy} {...props}>
            {busy ? (loadingText ?? 'Saving...') : (children ?? defaultText ?? 'Save')}
        </Button>
    );
}

export function SaveAndBackToListButton({
    processing,
    isLoading,
    loadingText,
    onClick,
    children,
    disabled,
    ...props
}: ComponentProps<typeof Button> & {
    processing?: boolean;
    isLoading?: boolean;
    loadingText?: string;
    onClick: () => void;
}) {
    const busy = Boolean(isLoading ?? processing);

    return (
        <Button type="button" variant="secondary" disabled={disabled || busy} onClick={onClick} {...props}>
            {busy ? (loadingText ?? 'Saving...') : (children ?? 'Save & back')}
        </Button>
    );
}

export function FormActions({ leading, children }: { leading?: ReactNode; children?: ReactNode }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
            <div className="flex flex-wrap gap-2">{leading}</div>
            <div className="flex flex-wrap gap-2">{children}</div>
        </div>
    );
}

export function FormLayout({
    children,
    onSubmit,
    id,
    className,
}: {
    children: ReactNode;
    onSubmit: FormEventHandler<HTMLFormElement>;
    id?: string;
    className?: string;
}) {
    return (
        <form id={id} onSubmit={onSubmit} className={cn('w-full max-w-none space-y-6', className)}>
            {children}
        </form>
    );
}

type InputFieldProps = {
    label: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    error?: string;
    type?: string;
    placeholder?: string;
    description?: string;
    required?: boolean;
};

export const InputField = forwardRef(function InputField(
    { label, value, onChange, error, type = 'text', placeholder, description, required }: InputFieldProps,
    ref: Ref<HTMLInputElement>,
) {
    return (
        <div className="grid gap-2">
            <label className="text-sm font-medium">
                {label}
                {required ? <span className="text-destructive"> *</span> : null}
            </label>
            <Input ref={ref} type={type} value={value} onChange={onChange} placeholder={placeholder} />
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
            <InputError message={error} />
        </div>
    );
});

export function CreatedAtContent({ date }: { date: string }) {
    if (!date) {
        return <span className="text-muted-foreground">—</span>;
    }
    const d = new Date(date);

    return <span className="text-sm text-muted-foreground">{Number.isNaN(d.getTime()) ? date : d.toLocaleString()}</span>;
}

export function UpdatedAtContent({ date }: { date: string }) {
    return <CreatedAtContent date={date} />;
}
