import { FormField, FormLayout, InputField } from '@/components/custom';
import PageEntityLayout from '@/layouts/page-entity-layout';
import { moduleFormSurfaceClassName } from '@/lib/module-ui';
import { BreadcrumbItem, Customer, Role } from '@/types';
import { useForm } from '@inertiajs/react';
import { ChangeEvent, FormEventHandler, useEffect, useRef } from 'react';

type FormData = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    roles: number[];
    customers: number[];
};

type Props = {
    roles: Role[];
    customers: Customer[];
    lang?: Record<string, string>;
};

export default function Create({ roles, customers, lang = {} }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: lang.breadcrumb_dashboard || 'Dashboard', href: route('dashboard') },
        { title: lang.breadcrumb_users || 'Users', href: route('users.index') },
        { title: lang.breadcrumb_create || 'Create' },
    ];
    const nameInput = useRef<HTMLInputElement>(null);
    const saveRedirectMode = useRef<'stay' | 'list'>('list');

    const { data, setData, errors, post, processing, reset, transform } = useForm<FormData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [],
        customers: [],
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

    const postOptions = {
        forceFormData: true,
        onSuccess: () => reset(),
        onError: (errs: Record<string, string>) => {
            if (errs.name) nameInput.current?.focus();
        },
    };

    const submitWithRedirect = (mode: 'stay' | 'list') => {
        saveRedirectMode.current = mode;
        post(route('users.store'), postOptions);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        submitWithRedirect('stay');
    };

    return (
        <PageEntityLayout
            title="Create User"
            description="Add a new user to the system."
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
            <FormLayout onSubmit={submit} className={moduleFormSurfaceClassName()}>
                <InputField
                    ref={nameInput}
                    label="Name"
                    value={data.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setData('name', e.target.value)}
                    placeholder="Enter user's full name"
                    error={errors.name}
                    description="Enter the user's full name (required)"
                    required
                />

                <InputField
                    label="Email"
                    type="email"
                    value={data.email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setData('email', e.target.value)}
                    placeholder="Enter user's email address"
                    error={errors.email}
                    description="Enter a valid email address (required, must be unique)"
                    required
                />

                <InputField
                    label="Password"
                    type="password"
                    value={data.password}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setData('password', e.target.value)}
                    placeholder="Enter a secure password"
                    error={errors.password}
                    description="Minimum 8 characters (required)"
                    required
                />

                <InputField
                    label="Confirm Password"
                    type="password"
                    value={data.password_confirmation}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setData('password_confirmation', e.target.value)}
                    placeholder="Confirm the password"
                    error={errors.password_confirmation}
                    description="Must match the password above (required)"
                    required
                />

                <FormField id="roles" label="Roles" required error={errors.roles}>
                    <div id="roles" className="grid grid-cols-2 gap-2 md:grid-cols-3">
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
                    label="Customers (Optional)"
                    error={errors.customers}
                    description="Select customers that this user can access (optional - Admin users see all customers)"
                >
                    <div id="customers" className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
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
