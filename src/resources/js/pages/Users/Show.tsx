import { EditButton } from '@/components/custom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useFlashMessages } from '@/hooks';
import PageEntityLayout from '@/layouts/page-entity-layout';
import { BreadcrumbItem, User } from '@/types';
import { format } from 'date-fns';
import { route } from 'ziggy-js';

type Props = {
    user: User & {
        roles?: Array<{ id: number; name: string }>;
        permissions?: Array<{ id: number; name: string }>;
        customers?: Array<{ id: number; name: string }>;
    };
    can: {
        user_edit: boolean;
        user_destroy: boolean;
    };
    lang?: Record<string, string>;
};

export default function Show({ user, can, lang = {} }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: lang.breadcrumb_dashboard || 'Dashboard', href: route('dashboard') },
        { title: lang.breadcrumb_users || 'Users', href: route('users.index') },
        { title: lang.breadcrumb_show || 'Details' },
    ];
    useFlashMessages();

    return (
        <PageEntityLayout
            title="User Details"
            description="View user information, roles, and permissions."
            breadcrumbs={breadcrumbs}
            footerMode="readonly"
            listHref={route('users.index')}
            listLabel={lang.button_back_to_list || 'Torna alla lista'}
            readonlyTrailing={can.user_edit ? <EditButton href={route('users.edit', user.id)} /> : null}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col gap-1.5">
                                    <CardTitle>User Information</CardTitle>
                                    <CardDescription>Basic user details and account information.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-2">
                                    <Label>Name</Label>
                                    <p className="text-sm font-medium">{user.name}</p>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Email</Label>
                                    <p className="text-sm font-mono">{user.email}</p>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Status</Label>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={user.active ? 'default' : 'secondary'}>{user.active ? 'Active' : 'Inactive'}</Badge>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Email Verified</Label>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={user.email_verified_at ? 'default' : 'destructive'}>
                                            {user.email_verified_at ? 'Verified' : 'Not Verified'}
                                        </Badge>
                                        {user.email_verified_at && (
                                            <p className="text-xs text-muted-foreground">on {format(new Date(user.email_verified_at), 'dd/MM/yyyy HH:mm')}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Created At</Label>
                                    <p className="text-sm text-muted-foreground">{user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy HH:mm') : '-'}</p>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Last Updated</Label>
                                    <p className="text-sm text-muted-foreground">{user.updated_at ? format(new Date(user.updated_at), 'dd/MM/yyyy HH:mm') : '-'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col gap-1.5">
                                    <CardTitle>Roles</CardTitle>
                                    <CardDescription>User roles and access levels.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {user.roles && user.roles.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {user.roles.map((role) => (
                                            <Badge key={role.id} variant="outline">
                                                {role.name}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No roles assigned</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex flex-col gap-1.5">
                                    <CardTitle>Permissions</CardTitle>
                                    <CardDescription>Specific permissions granted to this user.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {user.permissions && user.permissions.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {user.permissions.map((permission) => (
                                            <Badge key={permission.id} variant="secondary" className="text-xs">
                                                {permission.name}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No direct permissions assigned</p>
                                )}
                            </CardContent>
                        </Card>

                        {user.customers && user.customers.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <div className="flex flex-col gap-1.5">
                                        <CardTitle>Assigned Customers</CardTitle>
                                        <CardDescription>Customers assigned to this user.</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {user.customers.map((customer) => (
                                            <Badge key={customer.id} variant="outline">
                                                {customer.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </PageEntityLayout>
    );
}
