import * as React from 'react';

import { cn } from '@/lib/utils';

function Empty({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="empty" className={cn('flex flex-col items-center justify-center rounded-lg border p-8 text-center', className)} {...props} />;
}

function EmptyHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="empty-header" className={cn('flex max-w-sm flex-col items-center gap-2 text-center', className)} {...props} />;
}

function EmptyTitle({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="empty-title" className={cn('text-lg font-medium tracking-tight', className)} {...props} />;
}

function EmptyDescription({ className, ...props }: React.ComponentProps<'p'>) {
    return <p data-slot="empty-description" className={cn('text-muted-foreground text-sm text-balance', className)} {...props} />;
}

function EmptyContent({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="empty-content" className={cn('flex w-full max-w-sm flex-col items-center gap-4 text-center', className)} {...props} />;
}

function EmptyMedia({
    className,
    variant = 'default',
    ...props
}: React.ComponentProps<'div'> & { variant?: 'default' | 'icon' }) {
    return (
        <div
            data-slot="empty-media"
            data-variant={variant}
            className={cn(
                'flex shrink-0 items-center justify-center mb-2 [&_svg]:pointer-events-none [&_svg]:shrink-0',
                variant === 'icon' && 'bg-muted text-muted-foreground size-10 rounded-full [&_svg:not([class*=size-])]:size-6',
                className,
            )}
            {...props}
        />
    );
}

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle };
