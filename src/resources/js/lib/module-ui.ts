import { cn } from '@/lib/utils';

/** Contenitore form standard moduli (bordo, padding, dark mode). */
export const MODULE_FORM_SURFACE_CLASSNAME =
    'flex w-full flex-col gap-4 rounded-xl border border-sidebar-border/70 p-6 dark:border-sidebar-border';

/** Pannello sola lettura (schede show) allineato allo stesso bordo dei form modulo. */
export const ENTITY_READONLY_CARD_CLASSNAME =
    'rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border';

export function moduleFormSurfaceClassName(className?: string): string {
    return cn(MODULE_FORM_SURFACE_CLASSNAME, className);
}

export function entityReadonlyCardClassName(className?: string): string {
    return cn(ENTITY_READONLY_CARD_CLASSNAME, className);
}
