import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageLayout from '@/layouts/page-layout';
import { BreadcrumbItem, Permission } from '@/types';
import { useMemo, useState } from 'react';

interface Props {
    permissionsGrouped: Record<string, Permission[]>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Permissions', href: route('permissions.index') },
];

function CategoryPermissionsTable({ permissions }: { permissions: Permission[] }) {
    const [selected, setSelected] = useState<Set<string>>(() => new Set());
    const ids = useMemo(() => permissions.map((p) => String(p.id)), [permissions]);
    const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
    const someSelected = ids.some((id) => selected.has(id)) && !allSelected;
    const headerCheckbox: boolean | 'indeterminate' = allSelected
        ? true
        : someSelected
          ? 'indeterminate'
          : false;

    const togglePage = () => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (allSelected) {
                ids.forEach((id) => next.delete(id));
            } else {
                ids.forEach((id) => next.add(id));
            }
            return next;
        });
    };

    const toggleRow = (id: string) => {
        setSelected((prev) => {
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
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-10 max-w-10 px-2">
                        <Checkbox
                            checked={headerCheckbox}
                            onCheckedChange={() => togglePage()}
                            aria-label="Seleziona tutte le righe di questa categoria"
                        />
                    </TableHead>
                    <TableHead>Permission Name</TableHead>
                    <TableHead>Description</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {permissions.map((permission) => {
                    const id = String(permission.id);
                    return (
                        <TableRow key={permission.id}>
                            <TableCell className="w-10 max-w-10 px-2" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    checked={selected.has(id)}
                                    onCheckedChange={() => toggleRow(id)}
                                    aria-label="Seleziona riga"
                                />
                            </TableCell>
                            <TableCell className="font-medium">{permission.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                                {permission.description || 'No description available'}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

export default function PermissionsPage({ permissionsGrouped }: Props) {
    return (
        <PageLayout title="Permissions" description="View all available system permissions grouped by category." breadcrumbs={breadcrumbs}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {Object.entries(permissionsGrouped).map(([category, permissions]) => (
                    <Card key={category} className="flex h-full flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg">{category}</CardTitle>
                            <CardDescription>
                                {permissions.length} permission{permissions.length !== 1 ? 's' : ''} in this category
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col">
                            <CategoryPermissionsTable permissions={permissions} />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </PageLayout>
    );
}
