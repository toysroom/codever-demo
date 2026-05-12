import {
    CreateButton,
    DataTable,
    DeleteConfirmationModal,
    ExportButton,
    PageActions,
    PageHeaderActions,
    SearchInput,
    type DataTablePagination,
} from '@/components/custom';
import { useDataTable, useDeleteConfirmation, useExport, useFlashMessages } from '@/hooks';
import PageLayout from '@/layouts/page-layout';
import { BreadcrumbItem, PageProps, Role, Permission } from '@/types';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import { toastError } from '@/utils/toast';
import { getRoleColumns } from './columns';
import RolePermissionsModal from './RolePermissionsModal';

interface RolesIndexProps extends PageProps {
    roles: {
        data: Role[];
        pagination: DataTablePagination;
    };
    permissions: Permission[];
    lang: Record<string, string>;
    filters: {
        search: string;
        sort_field: string;
        sort_order: string;
    };
    can: {
        role_create: boolean;
        role_show?: boolean;
        role_edit: boolean;
        role_destroy: boolean;
        role_export: boolean;
        role_toggle_active: boolean;
    };
}


export default function RolesPage({ roles, permissions, filters, can, lang }: RolesIndexProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: lang.breadcrumb_dashboard, href: route('dashboard') },
        { title: lang.breadcrumb_roles, href: route('roles.index') },
    ];
    
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const { isConfirmingDelete, confirmDelete, executeDelete, cancelDelete } = useDeleteConfirmation();
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    // Initialize DataTable hook
    const { state, handlers } = useDataTable({
        initialPerPage: 50,
        initialSortField: filters.sort_field || 'priority',
        initialSortOrder: (filters.sort_order as 'asc' | 'desc') || 'desc',
        defaultVisibleColumns: {
            name: true,
            priority: true,
            description: true,
            permissions: true,
            users: true,
            created_at: false,
            updated_at: true,
            active: true,
            actions: true,
        },
        storageKey: 'roles_table',
        routeName: 'roles.index',
    });

    // Initialize Export hook
    const { isExporting, exportData } = useExport({
        exportRoute: route('roles.export'),
        resourceName: 'Roles',
    });

    const handleDelete = (role: Role) => {
        setRoleToDelete(role);
        confirmDelete(() => {
            router.delete(route('roles.destroy', role.id), {
                preserveScroll: true,
                onSuccess: () => {
                    cancelDelete();
                    setRoleToDelete(null);
                },
                onError: () => {
                    toastError('Failed to delete role');
                },
            });
        });
    };

    const isToggleLocked = (role: Role): boolean => Boolean(role.is_disabled);

    const handleToggleActive = (role: Role) => {
        if (isToggleLocked(role)) {
            toastError('This role cannot change its status');
            return;
        }

        router.post(
            route('roles.toggle-active', role.id),
            {},
            {
                preserveScroll: true,
                onError: () => {
                    toastError(lang.toggle_failed || 'Failed to toggle role status');
                },
            },
        );
    };

    const handleViewPermissions = (role: Role) => {
        setSelectedRole(role);
        setShowPermissionsModal(true);
    };

    // Define table columns
    const columns = getRoleColumns({
        columnLabels: {
            description: lang.column_description,
            priority: lang.column_priority,
        },
        visibleColumns: state.visibleColumns,
        can: {
            role_show: can.role_show,
            role_edit: can.role_edit,
            role_destroy: can.role_destroy,
            role_toggle_active: can.role_toggle_active,
        },
        onDelete: handleDelete,
        onToggleActive: handleToggleActive,
        onViewPermissions: handleViewPermissions,
        isToggleLocked,
    });

    const handleCloseDeleteModal = () => {
        cancelDelete();
        setRoleToDelete(null);
    };

    const handleExport = () => {
        exportData({
            search: state.search,
            sort_field: state.sortField,
            sort_order: state.sortOrder,
            visible_columns: state.visibleColumns,
        });
    };

    useFlashMessages();

    return (
        <PageLayout
            title={lang.index_title}
            description={lang.index_description}
            breadcrumbs={breadcrumbs}
            headerActions={
                can.role_create || can.role_export ? (
                    <PageActions>
                        {can.role_create && <CreateButton href={route('roles.create')}>{lang.create_button}</CreateButton>}
                        {can.role_export && <ExportButton onClick={handleExport} disabled={isExporting} />}
                    </PageActions>
                ) : undefined
            }
        >
            {/* Search */}
            <PageHeaderActions>
                <div className="w-full sm:w-96">
                    <SearchInput value={state.search} onSearch={handlers.handleSearch} placeholder={lang.search_placeholder} className="w-full" />
                    <p className="mt-1 text-xs text-gray-500">{lang.search_help}</p>
                </div>
            </PageHeaderActions>

            {/* Data Table */}
            <DataTable
                data={roles.data}
                columns={columns}
                pagination={roles.pagination}
                onPageChange={handlers.handlePageChange}
                onPerPageChange={handlers.handlePerPageChange}
                onColumnToggle={handlers.handleColumnToggle}
                onSort={handlers.handleSort}
                sortField={state.sortField}
                sortOrder={state.sortOrder}
                emptyMessage={lang.empty}
                columnToggleButtonLabel={lang.customize_columns_button}
                currentPerPage={state.perPage}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationModal
                isOpen={isConfirmingDelete}
                onClose={handleCloseDeleteModal}
                onConfirm={executeDelete}
                title={lang.delete_dialog_title}
                description={
                    <>
                        {lang.delete_dialog_description}{' '}
                        <strong className="font-semibold text-foreground">{roleToDelete?.name || lang.delete_dialog_fallback}</strong>?
                    </>
                }
                confirmText={lang.delete_dialog_confirm}
            />

            {/* Permissions Modal */}
            <RolePermissionsModal
                isOpen={showPermissionsModal}
                onClose={() => {
                    setShowPermissionsModal(false);
                    setSelectedRole(null);
                }}
                role={selectedRole}
                permissions={permissions}
            />
        </PageLayout>
    );
}
