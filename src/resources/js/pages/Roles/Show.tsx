import { EditButton } from '@/components/custom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useFlashMessages } from '@/hooks';
import PageEntityLayout from '@/layouts/page-entity-layout';
import { BreadcrumbItem, Role } from '@/types';
import { format } from 'date-fns';
import { route } from 'ziggy-js';

type Props = {
    role: Role & {
        permissions?: Array<{ id: number; name: string }>;
        users?: Array<{ id: number; name: string; email: string }>;
    };
    can: {
        role_edit: boolean;
        role_destroy: boolean;
    };
    lang?: Record<string, string>;
};

export default function Show({ role, can, lang = {} }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: lang.breadcrumb_dashboard || 'Dashboard', href: route('dashboard') },
        { title: lang.breadcrumb_roles || 'Roles', href: route('roles.index') },
        { title: lang.breadcrumb_show || 'Details' },
    ];
    useFlashMessages();

    return (
        <PageEntityLayout
            title="Role Details"
            description="View role information, permissions, and assigned users."
            breadcrumbs={breadcrumbs}
            footerMode="readonly"
            listHref={route('roles.index')}
            listLabel={lang.button_back_to_list || 'Torna alla lista'}
            readonlyTrailing={can.role_edit ? <EditButton href={route('roles.edit', role.id)} /> : null}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col gap-1.5">
                                    <CardTitle>Role Information</CardTitle>
                                    <CardDescription>Basic role details and status information.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-2">
                                    <Label>Name</Label>
                                    <p className="text-sm font-medium">{role.name}</p>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Status</Label>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={role.active ? 'default' : 'secondary'}>{role.active ? 'Active' : 'Inactive'}</Badge>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Priority</Label>
                                    <p className="text-sm font-medium">{role.priority ?? '-'}</p>
                                </div>

                                {role.description ? (
                                    <div className="grid gap-2">
                                        <Label>Description</Label>
                                        <p className="text-sm text-muted-foreground">{role.description}</p>
                                    </div>
                                ) : null}

                                <div className="grid gap-2">
                                    <Label>Created At</Label>
                                    <p className="text-sm text-muted-foreground">{role.created_at ? format(new Date(role.created_at), 'dd/MM/yyyy HH:mm') : '-'}</p>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Last Updated</Label>
                                    <p className="text-sm text-muted-foreground">{role.updated_at ? format(new Date(role.updated_at), 'dd/MM/yyyy HH:mm') : '-'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col gap-1.5">
                                    <CardTitle>Permissions</CardTitle>
                                    <CardDescription>Permissions granted to this role.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {role.permissions && role.permissions.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {role.permissions.map((permission) => (
                                            <Badge key={permission.id} variant="secondary" className="text-xs">
                                                {permission.name}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No permissions assigned</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex flex-col gap-1.5">
                                    <CardTitle>Assigned Users</CardTitle>
                                    <CardDescription>Users that have this role assigned.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {role.users && role.users.length > 0 ? (
                                    <div className="space-y-2">
                                        {role.users.map((user) => (
                                            <div key={user.id} className="flex items-center justify-between rounded-md border p-2">
                                                <div>
                                                    <p className="text-sm font-medium">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No users assigned to this role</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PageEntityLayout>
    );
}

