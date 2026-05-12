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
import { useDataTable, useDeleteConfirmation, useFlashMessages } from '@/hooks';
import PageLayout from '@/layouts/page-layout';
import { BreadcrumbItem, PageProps, User } from '@/types';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import { toastError, toastSuccess } from '@/utils/toast';
import { getUserColumns } from './columns';

interface UsersIndexProps extends PageProps {
    users: {
        data: User[];
        pagination: DataTablePagination;
    };
    lang: Record<string, string>;
    filters: {
        search: string;
        sort_field: string;
        sort_order: string;
    };
    can: {
        user_show: boolean;
        user_create: boolean;
        user_edit: boolean;
        user_destroy: boolean;
        user_export: boolean;
        user_toggle_active: boolean;
        customer_edit: boolean;
    };
}


export default function UsersPage({ users, can, lang }: UsersIndexProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: lang.breadcrumb_dashboard, href: route('dashboard') },
        { title: lang.breadcrumb_users, href: route('users.index') },
    ];
    
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const { isConfirmingDelete, confirmDelete, executeDelete, cancelDelete } = useDeleteConfirmation();

    // Initialize DataTable hook
    const { state, handlers } = useDataTable({
        initialPerPage: 50,
        initialSortField: 'name',
        initialSortOrder: 'asc',
        defaultVisibleColumns: {
            name: true,
            email: true,
            role: true,
            customers: true,
            created_at: false,
            updated_at: true,
            active: true,
            actions: true,
        },
        storageKey: 'users_table',
    });

    const handleDelete = (user: User) => {
        setUserToDelete(user);
        confirmDelete(() => {
            router.delete(route('users.destroy', user.id), {
                preserveScroll: true,
                onSuccess: () => {
                    cancelDelete();
                    setUserToDelete(null);
                },
                onError: () => {
                    toastError(lang.delete_failed);
                },
            });
        });
    };

    const handleToggleActive = (user: User) => {
        router.post(
            route('users.toggle-active', user.id),
            {},
            {
                onSuccess: () => {
                    toastSuccess(lang.toggle_success);
                },
                onError: () => {
                    toastError(lang.toggle_failed);
                },
            },
        );
    };

    // Define table columns
    const columns = getUserColumns({
        visibleColumns: state.visibleColumns,
        can: {
            user_show: can.user_show,
            user_edit: can.user_edit,
            user_destroy: can.user_destroy,
            user_toggle_active: can.user_toggle_active,
            customer_edit: can.customer_edit,
        },
        onDelete: handleDelete,
        onToggleActive: handleToggleActive,
    });

    const handleCloseDeleteModal = () => {
        cancelDelete();
        setUserToDelete(null);
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (state.search) params.set('search', state.search);
        if (state.sortField !== 'role_name') params.set('sort_field', state.sortField);
        if (state.sortOrder !== 'asc') params.set('sort_order', state.sortOrder);

        const queryString = params.toString();
        const baseUrl = route('users.export');
        const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

        window.open(url, '_blank');
    };

    useFlashMessages();

    return (
        <PageLayout
            title={lang.index_title}
            description={lang.index_description}
            breadcrumbs={breadcrumbs}
            headerActions={
                can.user_create || can.user_export ? (
                    <PageActions>
                        {can.user_create && <CreateButton href={route('users.create')}>{lang.create_button}</CreateButton>}
                        {can.user_export && <ExportButton onClick={handleExport} />}
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
                data={users.data}
                columns={columns}
                pagination={users.pagination}
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
                        <strong className="font-semibold text-foreground">{userToDelete?.name || lang.delete_dialog_fallback}</strong>?
                    </>
                }
                confirmText={lang.delete_dialog_confirm}
                lang={lang}
            />
        </PageLayout>
    );
}
