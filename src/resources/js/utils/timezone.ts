export const SYSTEM_TIMEZONE_OPTIONS = [
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Rome', label: 'Rome' },
] as const;

export function getTimezoneDisplayName(timezone: string, displayName?: string): string {
    if (displayName) {
        return displayName;
    }

    const fromOptions = SYSTEM_TIMEZONE_OPTIONS.find((o) => o.value === timezone);
    if (fromOptions) {
        return fromOptions.label;
    }

    return timezone || 'UTC';
}

/**
 * Etichetta compatta per footer sidebar, es. "London (GMT+01:00)".
 */
export function formatTimezoneFooterLabel(timezone: string): string {
    const city = getTimezoneDisplayName(timezone);
    try {
        const dtf = new Intl.DateTimeFormat('en-GB', {
            timeZone: timezone,
            timeZoneName: 'shortOffset',
        });
        const parts = dtf.formatToParts(new Date());
        const offset = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
        return offset ? `${city} (${offset})` : city;
    } catch {
        return city;
    }
}
