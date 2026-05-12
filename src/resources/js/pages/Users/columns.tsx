import {
    createActionsColumn,
    createActiveStatusColumn,
    createCreatedAtColumn,
    createSpacerColumn,
    createUpdatedAtColumn,
    DeleteButton,
    DisabledDeleteButton,
    EditButton,
    ToggleActiveButton,
    ViewButton,
    type DataTableColumn,
} from '@/components/custom';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { Copy } from 'lucide-react';
import { route } from 'ziggy-js';
import { User } from '@/types';
import { toastError, toastSuccess } from '@/utils/toast';

interface GetUserColumnsParams {
    visibleColumns: Record<string, boolean>;
    can: {
        user_show: boolean;
        user_edit: boolean;
        user_destroy: boolean;
        user_toggle_active: boolean;
        customer_edit: boolean;
    };
    onDelete: (user: User) => void;
    onToggleActive: (user: User) => void;
}

export const getUserColumns = ({ visibleColumns, can, onDelete, onToggleActive }: GetUserColumnsParams): DataTableColumn<User>[] => [
    {
        key: 'name',
        label: 'Name',
        sortable: true,
        visible: visibleColumns.name,
        headerClassName: 'w-[35%]',
        cellClassName: 'w-[35%]',
    },
    {
        key: 'email',
        label: 'Email',
        sortable: true,
        visible: visibleColumns.email,
        headerClassName: 'w-[30%]',
        cellClassName: 'w-[30%]',
        render: (value) => {
            const email = String(value || '').trim();
            if (!email) {
                return <span className="text-sm text-muted-foreground">—</span>;
            }

            const copyEmail = async () => {
                try {
                    await navigator.clipboard.writeText(email);
                    toastSuccess('Email copied to clipboard');
                } catch {
                    toastError('Unable to copy email');
                }
            };

            return (
                <div className="flex items-center gap-1.5">
                    <span className="truncate">{email}</span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 cursor-pointer"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void copyEmail();
                        }}
                        title="Copy email"
                        aria-label={`Copy email ${email}`}
                    >
                        <Copy className="h-3.5 w-3.5" />
                    </Button>
                </div>
            );
        },
    },
    {
        key: 'role',
        label: 'Role',
        sortable: true,
        visible: visibleColumns.role,
        headerClassName: 'w-[25%]',
        cellClassName: 'w-[25%]',
        render: (value, user) => user.roles?.map((role) => role.name).join(', ') || 'N/A',
    },
    {
        key: 'customers',
        label: 'Assigned customers',
        sortable: false,
        visible: visibleColumns.customers ?? true,
        headerClassName: 'max-w-[14rem]',
        cellClassName: 'max-w-[14rem]',
        render: (_value, user) => {
            const list = user.customers ?? [];
            if (list.length === 0) {
                return <span className="text-sm text-muted-foreground">—</span>;
            }
            return (
                <div className="flex max-w-xs flex-col gap-0.5 text-sm">
                    {list.map((c) =>
                        can.customer_edit ? (
                            <Link
                                key={c.id}
                                href={route('modules.customers.edit', { customer: c.id })}
                                className="truncate text-blue-600 hover:underline dark:text-blue-400"
                            >
                                {c.name}
                            </Link>
                        ) : (
                            <span key={c.id} className="truncate">
                                {c.name}
                            </span>
                        ),
                    )}
                </div>
            );
        },
    },
    createSpacerColumn<User>(),
    createCreatedAtColumn<User>({ visibleColumns }),
    createUpdatedAtColumn<User>({ visibleColumns }),
    createActiveStatusColumn<User>({
        visibleColumns,
    }),
    createActionsColumn<User>({
        visibleColumns,
        render: (user) => (
            <>
                {can.user_toggle_active && (
                    <ToggleActiveButton
                        isActive={Boolean(user.is_active ?? user.active)}
                        onClick={() => onToggleActive(user)}
                    />
                )}
                {can.user_show && <ViewButton href={route('users.show', user.id)} />}
                {can.user_edit && <EditButton href={route('users.edit', user.id)} />}
                {can.user_destroy &&
                    (user.roles?.some((role) => role.name === 'admin') ? (
                        <DisabledDeleteButton tooltip="Admin users cannot be deleted" />
                    ) : (
                        <DeleteButton onClick={() => onDelete(user)} entityName={user.name} />
                    ))}
            </>
        ),
    }),
];
