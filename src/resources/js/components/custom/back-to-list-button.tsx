import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { type ComponentProps, type ReactNode } from 'react';

type BackToListButtonProps = Omit<ComponentProps<typeof Button>, 'asChild' | 'children'> & {
    href: string;
    children: ReactNode;
};

export function BackToListButton({
    href,
    children,
    className,
    size = 'default',
    variant = 'outline',
    disabled,
    ...props
}: BackToListButtonProps) {
    if (disabled) {
        return (
            <Button type="button" variant={variant} size={size} className={cn('gap-2', className)} disabled {...props}>
                <ArrowLeft className="size-4 shrink-0" aria-hidden />
                {children}
            </Button>
        );
    }

    return (
        <Button variant={variant} size={size} className={className} asChild {...props}>
            <Link href={href} className="gap-2 [&_svg]:pointer-events-none">
                <ArrowLeft className="size-4 shrink-0" aria-hidden />
                {children}
            </Link>
        </Button>
    );
}
