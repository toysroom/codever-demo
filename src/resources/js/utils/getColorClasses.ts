const palette: Record<string, string> = {
    default: 'border-transparent bg-primary text-primary-foreground',
    primary: 'border-transparent bg-primary text-primary-foreground',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    success: 'border-transparent bg-emerald-600 text-white',
    warning: 'border-transparent bg-amber-500 text-white',
    danger: 'border-transparent bg-destructive text-destructive-foreground',
    info: 'border-transparent bg-sky-600 text-white',
    gray: 'border-transparent bg-muted text-foreground',
};

/** Classi Tailwind per `Badge` in base a una chiave colore del progetto originale. */
export function getColorClasses(color: string): string {
    return palette[color] ?? palette.gray;
}
