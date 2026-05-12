import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFlashMessages } from '@/hooks';
import PageLayout from '@/layouts/page-layout';
import { AccountOption, BreadcrumbItem, CatalogModule, PageProps } from '@/types';
import { useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { FormEventHandler, useCallback, useEffect, useMemo, useState } from 'react';

interface ModulesIndexProps extends PageProps {
    modules: CatalogModule[];
    accounts: AccountOption[];
    lang: Record<string, string>;
}

export default function ModulesIndex({ modules, accounts, lang }: ModulesIndexProps) {
    useFlashMessages();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: lang.breadcrumb_dashboard, href: route('dashboard') },
        { title: lang.breadcrumb_modules, href: route('settings.modules.index') },
    ];

    const [accountId, setAccountId] = useState<string>('');

    const assignableModules = useMemo(() => modules.filter((m) => m.is_active), [modules]);

    const coreIds = useMemo(() => assignableModules.filter((m) => m.is_core).map((m) => m.id), [assignableModules]);

    const withCore = useCallback(
        (optionalIds: number[]) => [...new Set([...coreIds, ...optionalIds])],
        [coreIds],
    );

    const { data, setData, put, processing } = useForm<{ module_ids: number[] }>({
        module_ids: [],
    });

    useEffect(() => {
        if (!accountId) {
            setData('module_ids', []);
            return;
        }
        const id = Number(accountId);
        const account = accounts.find((t) => t.id === id);
        if (!account) {
            setData('module_ids', []);
            return;
        }
        const allowed = new Set(assignableModules.map((m) => m.id));
        const fromAccount = account.module_ids.filter((mid) => allowed.has(mid));
        setData('module_ids', withCore(fromAccount));
    }, [accountId, accounts, assignableModules, setData, withCore]);

    const toggleModule = (moduleId: number, checked: boolean, isCore: boolean) => {
        if (isCore) {
            return;
        }
        const optional = data.module_ids.filter((mid) => {
            const m = assignableModules.find((x) => x.id === mid);
            return m && !m.is_core;
        });
        const nextOptional = checked ? [...optional, moduleId] : optional.filter((mid) => mid !== moduleId);
        setData('module_ids', withCore(nextOptional));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const id = Number(accountId);
        if (!id) {
            return;
        }
        put(route('settings.modules.members.update', id));
    };

    const selectedNumericId = accountId ? Number(accountId) : 0;

    const [catalogSelected, setCatalogSelected] = useState<Set<string>>(() => new Set());
    const catalogRowIds = useMemo(() => modules.map((m) => String(m.id)), [modules]);
    const allCatalogSelected = catalogRowIds.length > 0 && catalogRowIds.every((id) => catalogSelected.has(id));
    const someCatalogSelected =
        catalogRowIds.some((id) => catalogSelected.has(id)) && !allCatalogSelected;
    const catalogHeaderCheckbox: boolean | 'indeterminate' = allCatalogSelected
        ? true
        : someCatalogSelected
          ? 'indeterminate'
          : false;

    const toggleCatalogPage = () => {
        setCatalogSelected((prev) => {
            const next = new Set(prev);
            if (allCatalogSelected) {
                catalogRowIds.forEach((id) => next.delete(id));
            } else {
                catalogRowIds.forEach((id) => next.add(id));
            }
            return next;
        });
    };

    const toggleCatalogRow = (id: string) => {
        setCatalogSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    return (
        <PageLayout title={lang.title} description={lang.description} breadcrumbs={breadcrumbs}>
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>{lang.catalog_title}</CardTitle>
                        <CardDescription>{lang.catalog_help}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10 max-w-10 px-2">
                                        <Checkbox
                                            checked={catalogHeaderCheckbox}
                                            onCheckedChange={() => toggleCatalogPage()}
                                            aria-label="Seleziona tutte le righe"
                                        />
                                    </TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>{lang.catalog_folder}</TableHead>
                                    <TableHead>{lang.catalog_origin}</TableHead>
                                    <TableHead>Catalogo</TableHead>
                                    <TableHead>Core</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {modules.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell
                                            className="w-10 max-w-10 px-2"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Checkbox
                                                checked={catalogSelected.has(String(m.id))}
                                                onCheckedChange={() => toggleCatalogRow(String(m.id))}
                                                aria-label="Seleziona riga"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{m.name}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{m.slug}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm font-mono">
                                            {m.folder ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            {m.in_filesystem ? (
                                                <Badge variant="outline">{lang.catalog_source_filesystem}</Badge>
                                            ) : (
                                                <Badge variant="secondary">{lang.catalog_source_database}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {m.is_active ? (
                                                <Badge variant="default">Attivo</Badge>
                                            ) : (
                                                <Badge variant="secondary">{lang.inactive_module}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>{m.is_core ? <Badge variant="outline">Core</Badge> : '—'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {modules.length === 0 ? <p className="text-muted-foreground mt-4 text-sm">Nessun modulo in catalogo.</p> : null}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{lang.assign_title}</CardTitle>
                        <CardDescription>{lang.assign_help}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {accounts.length === 0 ? (
                            <p className="text-muted-foreground text-sm">{lang.no_accounts}</p>
                        ) : (
                            <form onSubmit={submit} className="space-y-6">
                                <div className="grid max-w-md gap-2">
                                    <Label htmlFor="account">{lang.account_label}</Label>
                                    <Select value={accountId} onValueChange={setAccountId}>
                                        <SelectTrigger id="account">
                                            <SelectValue placeholder={lang.account_placeholder} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accounts.map((t) => (
                                                <SelectItem key={t.id} value={String(t.id)}>
                                                    {t.label}
                                                    {t.email ? ` (${t.email})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {!accountId ? (
                                    <p className="text-muted-foreground text-sm">{lang.select_account}</p>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-sm font-medium">{lang.modules_for_account}</p>
                                        <div className="space-y-3">
                                            {assignableModules.map((m) => {
                                                const checked = data.module_ids.includes(m.id);
                                                return (
                                                    <div key={m.id} className="flex items-start gap-3">
                                                        <Checkbox
                                                            id={`mod-${m.id}`}
                                                            checked={checked}
                                                            disabled={m.is_core}
                                                            onCheckedChange={(v) => toggleModule(m.id, v === true, m.is_core)}
                                                        />
                                                        <div className="grid gap-0.5 leading-none">
                                                            <Label htmlFor={`mod-${m.id}`} className="cursor-pointer font-normal">
                                                                {m.name}
                                                                {m.is_core ? (
                                                                    <span className="text-muted-foreground ml-2 text-xs">({lang.core_locked})</span>
                                                                ) : null}
                                                            </Label>
                                                            {m.description ? (
                                                                <p className="text-muted-foreground text-xs">{m.description}</p>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <Button type="submit" disabled={processing || !selectedNumericId}>
                                            {lang.save}
                                        </Button>
                                    </div>
                                )}
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}
