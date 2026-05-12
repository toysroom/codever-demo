import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageLayout from '@/layouts/page-layout';
import { BreadcrumbItem, PageProps, Preference, SharedData } from '@/types';
import { SYSTEM_TIMEZONE_OPTIONS, getTimezoneDisplayName } from '@/utils/timezone';
import { useForm, usePage } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { FormEventHandler, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

interface PreferencesIndexProps extends PageProps {
    preferences: Preference[];
    orderCustomerStates?: unknown[];
    orderSupplierStates?: unknown[];
    documentPdfTemplates?: unknown[];
    flash?: {
        success?: string | null;
        error?: string | null;
        warning?: string | null;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Preferences', href: route('preferences.index') },
];

const SYSTEM_CODES = ['session_duration', 'system_timezone'] as const;

export default function PreferencesIndex({ preferences }: PreferencesIndexProps) {
    const page = usePage<SharedData>();
    const can = page.props.auth?.can ?? { preference_edit: false };

    const systemPreferences = useMemo(
        () =>
            SYSTEM_CODES.map((code) => preferences.find((p) => p.code === code)).filter(
                (p): p is Preference => p !== undefined,
            ),
        [preferences],
    );

    const { data, setData, put, processing, errors } = useForm({
        preferences: preferences.map((preference) => ({
            id: preference.id,
            value: preference.value,
            notes: preference.notes || '',
        })),
    });

    const { flash } = usePage<PreferencesIndexProps>().props;

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

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('preferences.update'));
    };

    const renderValueEditor = (preference: Preference) => {
        const originalIndex = preferences.findIndex((p) => p.id === preference.id);
        if (originalIndex === -1) {
            return null;
        }

        if (!can.preference_edit) {
            return (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                    {preference.type === 'timezone' && data.preferences[originalIndex]?.value
                        ? getTimezoneDisplayName(data.preferences[originalIndex].value)
                        : (data.preferences[originalIndex]?.value ?? '')}
                </div>
            );
        }

        if (preference.type === 'timezone') {
            return (
                <select
                    id={`value-${preference.id}`}
                    value={data.preferences[originalIndex]?.value || ''}
                    onChange={(e) => {
                        const next = [...data.preferences];
                        next[originalIndex] = { ...next[originalIndex], value: e.target.value };
                        setData('preferences', next);
                    }}
                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${errors[`preferences.${originalIndex}.value`] ? 'border-red-500' : ''}`}
                >
                    {SYSTEM_TIMEZONE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {getTimezoneDisplayName(opt.value, opt.label)}
                        </option>
                    ))}
                </select>
            );
        }

        return (
            <Input
                id={`value-${preference.id}`}
                type={preference.type === 'number' ? 'number' : 'text'}
                min={preference.type === 'number' ? 1 : undefined}
                step={preference.type === 'number' ? 1 : undefined}
                value={data.preferences[originalIndex]?.value || ''}
                onChange={(e) => {
                    const next = [...data.preferences];
                    next[originalIndex] = { ...next[originalIndex], value: e.target.value };
                    setData('preferences', next);
                }}
                className={errors[`preferences.${originalIndex}.value`] ? 'border-red-500' : ''}
            />
        );
    };

    return (
        <PageLayout
            title="Preferences"
            description="Impostazioni di sistema: sessione e fuso orario."
            breadcrumbs={breadcrumbs}
        >
            <Tabs defaultValue="system" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="system">System</TabsTrigger>
                </TabsList>

                <TabsContent value="system" className="space-y-6">
                    <form onSubmit={submit} className="space-y-6">
                        {systemPreferences.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Nessuna preferenza di sistema configurata. Esegui il seeder delle preferenze o la migration.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                {systemPreferences.map((preference) => {
                                    const originalIndex = preferences.findIndex((p) => p.id === preference.id);

                                    return (
                                        <Card key={preference.id} className="flex h-full flex-col">
                                            <CardHeader>
                                                <CardTitle className="text-lg">{preference.name}</CardTitle>
                                                <CardDescription>Code: {preference.code}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex flex-1 flex-col space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor={`value-${preference.id}`}>Value</Label>
                                                    {renderValueEditor(preference)}
                                                    {errors[`preferences.${originalIndex}.value`] && (
                                                        <p className="text-sm text-red-500">
                                                            {errors[`preferences.${originalIndex}.value`]}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Notes</Label>
                                                    <div className="min-h-[4rem] rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                                                        {preference.notes || '—'}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        {can.preference_edit && systemPreferences.length > 0 && (
                            <div className="flex justify-start border-t pt-4">
                                <Button type="submit" disabled={processing} size="lg" className="inline-flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    {processing ? 'Saving…' : 'Save system settings'}
                                </Button>
                            </div>
                        )}
                    </form>
                </TabsContent>
            </Tabs>
        </PageLayout>
    );
}
