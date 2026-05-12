import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { type SharedData } from '@/types';
import { SYSTEM_TIMEZONE_OPTIONS, formatTimezoneFooterLabel } from '@/utils/timezone';
import { router, usePage } from '@inertiajs/react';
import { Clock } from 'lucide-react';
import { route } from 'ziggy-js';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export function SidebarDateTimeFooter() {
    const page = usePage<SharedData>();
    const sidebarPreferences = page.props.sidebarPreferences;
    const currentLocale = page.props.currentLocale ?? 'en';
    const canEdit = Boolean(page.props.auth?.can?.preference_edit);
    const prefId = sidebarPreferences?.timezone_preference_id ?? null;
    const serverTz = sidebarPreferences?.timezone ?? 'UTC';

    const [now, setNow] = useState(() => new Date());
    const [tz, setTz] = useState(serverTz);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setTz(serverTz);
    }, [serverTz]);

    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(id);
    }, []);

    const localeTag = currentLocale === 'it' ? 'it-IT' : 'en-GB';

    const formattedDateTime = useMemo(() => {
        try {
            return new Intl.DateTimeFormat(localeTag, {
                dateStyle: 'short',
                timeStyle: 'medium',
                timeZone: tz,
            }).format(now);
        } catch {
            return new Intl.DateTimeFormat(localeTag, {
                dateStyle: 'short',
                timeStyle: 'medium',
            }).format(now);
        }
    }, [now, tz, localeTag]);

    const timezoneLabel = useMemo(() => formatTimezoneFooterLabel(tz), [tz]);

    const showPicker = canEdit && prefId !== null;

    const onTimezoneChange = (next: string) => {
        if (!prefId) {
            return;
        }
        if (next === serverTz) {
            return;
        }
        setTz(next);
        setSaving(true);
        router.put(
            route('preferences.update'),
            {
                preferences: [{ id: prefId, value: next, notes: '' }],
            },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
                onSuccess: () => {
                    toast.success(currentLocale === 'it' ? 'Fuso orario aggiornato.' : 'Timezone updated.');
                },
                onError: () => {
                    setTz(serverTz);
                    toast.error(currentLocale === 'it' ? 'Impossibile aggiornare il fuso orario.' : 'Could not update timezone.');
                },
            },
        );
    };

    return (
        <div className="group-data-[collapsible=icon]:hidden">
            <Separator className="my-2" />
            <p className="text-muted-foreground px-2 font-mono text-xs leading-relaxed">{formattedDateTime}</p>
            <Separator className="my-2" />
            {showPicker ? (
                <div className="flex items-center gap-2 px-2 pb-1">
                    <Clock className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    <Select value={tz} onValueChange={onTimezoneChange} disabled={saving}>
                        <SelectTrigger className="h-8 flex-1 border-0 bg-transparent text-xs shadow-none ring-0 focus:ring-0 [&>span]:truncate">
                            <SelectValue placeholder={timezoneLabel} />
                        </SelectTrigger>
                        <SelectContent>
                            {SYSTEM_TIMEZONE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {formatTimezoneFooterLabel(opt.value)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ) : (
                <div className="text-muted-foreground flex items-center gap-2 px-2 pb-1 text-xs">
                    <Clock className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{timezoneLabel}</span>
                </div>
            )}
        </div>
    );
}
