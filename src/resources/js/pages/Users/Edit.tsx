import { FormField, FormLayout, InputField } from '@/components/custom';
import PageEntityLayout from '@/layouts/page-entity-layout';
import { moduleFormSurfaceClassName } from '@/lib/module-ui';
import { cn } from '@/lib/utils';
import { BreadcrumbItem, Customer, Role, User } from '@/types';
import { useForm } from '@inertiajs/react';
import { ChangeEvent, FormEventHandler, useEffect, useRef } from 'react';

type Props = {
    user: User;
    roles: Role[];
    userRoles: number[];
    customers: Customer[];
    userCustomers: number[];
    lang?: Record<string, string>;
};

export default function Edit({ user, roles, userRoles, customers, userCustomers, lang = {} }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: lang.breadcrumb_dashboard || 'Dashboard', href: route('dashboard') },
        { title: lang.breadcrumb_users || 'Users', href: route('users.index') },
        { title: `${lang.breadcrumb_edit || 'Edit'} ${user.name}` },
    ];
    const nameInput = useRef<HTMLInputElement>(null);
    const saveRedirectMode = useRef<'stay' | 'list'>('list');

    const { data, setData, errors, put, processing, transform } = useForm({
        name: user.name,
        email: user.email,
        roles: userRoles,
        customers: userCustomers,
    });

    useEffect(() => {
        transform((form) => ({
            ...form,
            save_redirect: saveRedirectMode.current,
        }));
    }, [transform]);

    const toggleRole = (id: number) => {
        setData('roles', data.roles.includes(id) ? data.roles.filter((rid) => rid !== id) : [...data.roles, id]);
    };

    const toggleCustomer = (id: number) => {
        setData('customers', data.customers.includes(id) ? data.customers.filter((cid) => cid !== id) : [...data.customers, id]);
    };

    const putOptions = {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {},
        onError: (errs: Record<string, string>) => {
            if (errs.name) nameInput.current?.focus();
        },
    };

    const submitWithRedirect = (mode: 'stay' | 'list') => {
        saveRedirectMode.current = mode;
        put(route('users.update', user.id), putOptions);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        submitWithRedirect('stay');
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <PageEntityLayout
            title={hasErrors ? (lang.edit_title_with_errors || 'Edit User - Please fix errors') : (lang.edit_title || 'Edit User')}
            description={
                hasErrors
                    ? (lang.edit_description_with_errors || 'Please fix the validation errors below.')
                    : (lang.edit_description_normal || 'Update user information and settings.')
            }
            breadcrumbs={breadcrumbs}
            footerMode="form"
            listHref={route('users.index')}
            listLabel={lang.button_back_to_list || 'Torna alla lista'}
            processing={processing}
            loadingMessage={lang.saving || 'Operazione in corso…'}
            saveStayLabel={lang.save || 'Salva'}
            saveListLabel={lang.save_and_back_to_list || 'Salva e torna alla lista'}
            onSaveStay={() => submitWithRedirect('stay')}
            onSaveList={() => submitWithRedirect('list')}
        >
            {Object.keys(errors).length > 0 && (
                <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
                    <h3 className="mb-2 text-sm font-medium text-red-800">{lang.edit_fix_errors_title || 'Please fix the following errors:'}</h3>
                    <ul className="space-y-1 text-sm text-red-700">
                        {Object.entries(errors).map(([field, error]) => (
                            <li key={field}>
                                • {field}: {error}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <FormLayout onSubmit={submit} className={moduleFormSurfaceClassName()}>
                <InputField
                    ref={nameInput}
                    label="Name"
                    value={data.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setData('name', e.target.value)}
                    placeholder={lang.edit_placeholder_name || "Enter user's full name"}
                    error={errors.name}
                    description={errors.name ? (lang.edit_description_name_required || 'This field is required') : (lang.edit_description_name || "Enter the user's full name (required)")}
                    required
                />

                <InputField
                    label="Email"
                    type="email"
                    value={data.email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setData('email', e.target.value)}
                    placeholder={lang.edit_placeholder_email || "Enter user's email address"}
                    error={errors.email}
                    description={errors.email ? errors.email : (lang.edit_description_email || 'Enter a valid email address (required, must be unique)')}
                    required
                />

                <FormField id="roles" label={lang.edit_label_roles || 'Roles'} required error={errors.roles}>
                    <div
                        id="roles"
                        className={cn(
                            'grid grid-cols-2 gap-2 rounded-md border p-2 md:grid-cols-3',
                            errors.roles ? 'border-destructive' : 'border-border',
                        )}
                    >
                        {roles.map((role) => (
                            <label key={role.id} className="flex items-center gap-2">
                                <input type="checkbox" value={role.id} checked={data.roles.includes(role.id)} onChange={() => toggleRole(role.id)} />
                                <span className="text-xs">{role.name}</span>
                            </label>
                        ))}
                    </div>
                </FormField>

                <FormField
                    id="customers"
                    label={lang.edit_label_customers || 'Customers (Optional)'}
                    error={errors.customers}
                    description={lang.edit_description_customers || 'Select customers that this user can access (optional - Admin users see all customers)'}
                >
                    <div
                        id="customers"
                        className={cn(
                            'grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3',
                            errors.customers && 'rounded-md border-2 border-destructive p-2',
                        )}
                    >
                        {customers.map((customer) => (
                            <label key={customer.id} className="flex items-center gap-2 rounded-md border p-2 hover:bg-muted/50">
                                <input type="checkbox" value={customer.id} checked={data.customers.includes(customer.id)} onChange={() => toggleCustomer(customer.id)} />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{customer.name}</span>
                                    <span className="text-xs text-muted-foreground">{customer.email}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </FormField>
            </FormLayout>
        </PageEntityLayout>
    );
}
