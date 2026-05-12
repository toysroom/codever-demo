import { FormField, FormLayout } from '@/components/custom';
import { Input } from '@/components/ui/input';
import PageEntityLayout from '@/layouts/page-entity-layout';
import { moduleFormSurfaceClassName } from '@/lib/module-ui';
import { BreadcrumbItem, Permission, Role } from '@/types';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef } from 'react';
import { route } from 'ziggy-js';

type EditRoleForm = {
    name: string;
    permissions: number[];
};

type Props = {
    role: Role;
    permissions: Permission[];
    lang?: Record<string, string>;
};

export default function Edit({ role, permissions, lang = {} }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: lang.breadcrumb_dashboard || 'Dashboard', href: route('dashboard') },
        { title: lang.breadcrumb_roles || 'Roles', href: route('roles.index') },
        { title: `${lang.breadcrumb_edit || 'Edit'} ${role.name}` },
    ];
    const roleName = useRef<HTMLInputElement>(null);
    const saveRedirectMode = useRef<'stay' | 'list'>('list');

    const { data, setData, errors, put, reset, processing, transform } = useForm<Required<EditRoleForm>>({
        name: role.name,
        permissions: (role.permissions ?? []).map((p) => p.id),
    });

    useEffect(() => {
        transform((form) => ({
            ...form,
            save_redirect: saveRedirectMode.current,
        }));
    }, [transform]);

    const togglePermission = (id: number) => {
        if (data.permissions.includes(id)) {
            setData(
                'permissions',
                data.permissions.filter((p) => p !== id),
            );
        } else {
            setData('permissions', [...data.permissions, id]);
        }
    };

    const putOptions = {
        preserveScroll: true,
        onSuccess: () => {
            reset();
        },
        onError: (errs: Record<string, string>) => {
            if (errs.name) {
                reset('name');
                roleName.current?.focus();
            }
        },
    };

    const submitWithRedirect = (mode: 'stay' | 'list') => {
        saveRedirectMode.current = mode;
        put(route('roles.update', role.id), putOptions);
    };

    const updateRole: FormEventHandler = (e) => {
        e.preventDefault();
        submitWithRedirect('stay');
    };

    return (
        <PageEntityLayout
            title="Edit Role"
            description="Update role information and permissions."
            breadcrumbs={breadcrumbs}
            footerMode="form"
            listHref={route('roles.index')}
            listLabel={lang.button_back_to_list || 'Torna alla lista'}
            processing={processing}
            loadingMessage={lang.saving || 'Operazione in corso…'}
            saveStayLabel={lang.save || 'Salva'}
            saveListLabel={lang.save_and_back_to_list || 'Salva e torna alla lista'}
            onSaveStay={() => submitWithRedirect('stay')}
            onSaveList={() => submitWithRedirect('list')}
        >
            <FormLayout onSubmit={updateRole} className={moduleFormSurfaceClassName()}>
                <FormField
                    id="name"
                    label="Role Name"
                    required
                    error={errors.name}
                    description="Enter a unique role name (required)"
                >
                    <Input
                        id="name"
                        ref={roleName}
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="block w-full"
                        placeholder="Enter role name"
                    />
                </FormField>

                <FormField id="permissions" label="Permissions" required error={errors.permissions}>
                    <div id="permissions" className="max-h-[min(70vh,32rem)] overflow-auto rounded-md border border-input p-4 dark:bg-input/10">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                            {Object.entries(
                                permissions.reduce(
                                    (acc, perm) => {
                                        const category = perm.category || 'Other';
                                        if (!acc[category]) acc[category] = [];
                                        acc[category].push(perm);
                                        return acc;
                                    },
                                    {} as Record<string, typeof permissions>,
                                ),
                            ).map(([category, categoryPermissions]) => (
                                <div
                                    key={category}
                                    className="flex h-full flex-col rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                                >
                                    <h4 className="mb-3 text-sm font-medium text-muted-foreground">{category}</h4>
                                    <div className="grid flex-1 grid-cols-1 gap-2">
                                        {categoryPermissions.map((perm) => (
                                            <label key={perm.id} className="flex cursor-pointer items-start space-x-2 select-none">
                                                <input
                                                    type="checkbox"
                                                    value={perm.id}
                                                    checked={data.permissions.includes(perm.id)}
                                                    onChange={() => togglePermission(perm.id)}
                                                    className="mt-1"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{perm.name}</span>
                                                    {perm.description && <span className="mt-1 text-xs text-muted-foreground">{perm.description}</span>}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </FormField>
            </FormLayout>
        </PageEntityLayout>
    );
}
