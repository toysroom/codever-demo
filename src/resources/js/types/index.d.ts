import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface Auth {
    user: User;
    /** Permessi opzionali per pagine admin (es. Preferences). */
    can?: Record<string, boolean>;
}

export interface BreadcrumbItem {
    title: string;
    /** Ultimo crumb (es. titolo pagina corrente) può non avere link. */
    href?: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export type SidebarNavIcon =
    | 'layout-grid'
    | 'users'
    | 'clipboard-list'
    | 'folder-tree'
    | 'user'
    | 'user-plus'
    | 'shield'
    | 'sliders-horizontal'
    | 'package'
    | 'file-text'
    | 'info'
    | 'database'
    | 'building-2'
    | 'layers'
    | 'globe'
    | 'warehouse'
    | 'server'
    | 'landmark'
    | 'tags';

export interface SidebarNavItem {
    title: string;
    href: string;
    icon?: SidebarNavIcon;
}

export interface SharedUiNav {
    menu: string;
    settings: string;
    account_modules: string;
    anagrafiche?: string;
    /** Sezione collassabile modulo Web */
    web?: string;
}

export interface NotificationItem {
    id: string;
    read_at: string | null;
    created_at: string;
    data: {
        title?: string;
        body?: string;
        href?: string | null;
        customer_name?: string;
        [key: string]: unknown;
    };
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    currentLocale?: string;
    /** Etichette shell (sidebar) dalla locale Laravel */
    ui?: {
        nav: SharedUiNav;
    };
    availableLocales?: Record<string, string>;
    sidebarNavItems?: SidebarNavItem[];
    /** Categorie, listini, prodotti sotto "Anagrafiche" */
    anagraficheNavItems?: SidebarNavItem[];
    /** Domini ecc. sotto modulo "Web" */
    webNavItems?: SidebarNavItem[];
    /** Moduli account (admin), sezione separata da Settings */
    accountModulesNavItems?: SidebarNavItem[];
    /** Sottovoci Settings (admin / permessi dedicati) */
    settingsNavItems?: SidebarNavItem[];
    /** Fuso orario di sistema (preferenza `system_timezone`) per footer sidebar */
    sidebarPreferences?: {
        timezone: string;
        timezone_preference_id: number | null;
    };
    flash?: {
        success?: string | null;
        error?: string | null;
        warning?: string | null;
    };
    notifications?: {
        unread_count: number;
        items: NotificationItem[];
    };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    user_type?: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    active?: boolean;
    is_active?: boolean;
    roles?: Array<{ id: number; name: string }>;
    customers?: Array<{ id: number; name: string }>;
    [key: string]: unknown; // This allows for additional properties...
}

export interface PageProps extends Record<string, unknown> {
    errors?: Record<string, string>;
}

export interface DataTablePagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export type DataTableColumn<T> = {
    key: string;
    label: string;
    sortable?: boolean;
    visible?: boolean;
    headerClassName?: string;
    cellClassName?: string;
    headerAlign?: 'left' | 'right' | 'center';
    cellAlign?: 'left' | 'right' | 'center';
    render?: (value: unknown, row: T) => ReactNode;
};

export interface CatalogModule {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    is_active: boolean;
    is_core: boolean;
    folder?: string | null;
    in_filesystem?: boolean;
}

export interface AccountOption {
    id: number;
    label: string;
    email: string | null;
    module_ids: number[];
}

/** Opzioni select “Account” / tenant nei form modulo (stesso payload backend degli account owner). */
export type MemberOwnerOption = Pick<AccountOption, 'id' | 'label'>;

export interface Role {
    id: number;
    name: string;
    guard_name?: string;
    created_at?: string;
    updated_at?: string;
    permissions?: Permission[];
    users?: Array<{ id: number; name: string; email?: string }>;
    /** Se true, il toggle attivo/inattivo è bloccato (es. ruoli di sistema). */
    is_disabled?: boolean;
    is_deleteble?: boolean;
    is_active?: boolean;
    active?: boolean;
    priority?: number;
    description?: string;
    [key: string]: unknown;
}

export interface Permission {
    id: number;
    name: string;
    guard_name?: string;
    category?: string;
    description?: string;
    permissions?: Permission[];
    [key: string]: unknown;
}

export interface Customer {
    id: number;
    name: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    [key: string]: unknown;
}

export interface Preference {
    id: number;
    code?: string;
    name: string;
    value: string;
    notes?: string;
    category?: string;
    [key: string]: unknown;
}

export interface ActivityLog {
    id: number;
    log_name?: string | null;
    description?: string | null;
    subject_type?: string | null;
    subject_id?: string | number | null;
    causer_type?: string | null;
    causer_id?: string | number | null;
    event?: string | null;
    properties?: Record<string, unknown> | unknown[] | null;
    created_at?: string;
    updated_at?: string;
    batch_uuid?: string | null;
    [key: string]: unknown;
}
