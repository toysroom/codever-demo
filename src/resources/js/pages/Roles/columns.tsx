import {
    createActionsColumn,
    createActiveStatusColumn,
    createCreatedAtColumn,
    createSpacerColumn,
    createUpdatedAtColumn,
    DeleteButton,
    DisabledDeleteButton,
    EditButton,
    parseTruthyFlag,
    ToggleActiveButton,
    ViewButton,
    type DataTableColumn,
} from '@/components/custom';
import { Role } from '@/types';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface GetRoleColumnsParams {
    columnLabels: {
        description: string;
        priority?: string;
    };
    visibleColumns: Record<string, boolean>;
    can: {
        role_show?: boolean;
        role_edit: boolean;
        role_destroy: boolean;
        role_toggle_active: boolean;
    };
    onDelete: (role: Role) => void;
    onToggleActive: (role: Role) => void;
    onViewPermissions: (role: Role) => void;
    isToggleLocked: (role: Role) => boolean;
}

export const getRoleColumns = ({
    columnLabels,
    visibleColumns,
    can,
    onDelete,
    onToggleActive,
    onViewPermissions,
    isToggleLocked,
}: GetRoleColumnsParams): DataTableColumn<Role>[] => [
    {
        key: 'name',
        label: 'Name',
        sortable: true,
        visible: visibleColumns.name,
        headerClassName: 'min-w-[8rem] max-w-[14rem]',
        cellClassName: 'min-w-[8rem] max-w-[14rem]',
        render: (value, role) => <div className="font-medium">{role.name}</div>,
    },
    {
        key: 'priority',
        label: columnLabels.priority || 'Priority',
        sortable: true,
        visible: visibleColumns.priority,
        headerClassName: 'min-w-[7rem]',
        cellClassName: 'min-w-[7rem]',
        render: (value) => <span className="font-medium">{Number(value ?? 0)}</span>,
    },
    {
        key: 'description',
        label: columnLabels.description,
        sortable: false,
        visible: visibleColumns.description,
        headerClassName: 'min-w-[28rem] w-[38%] align-top',
        cellClassName: 'min-w-[28rem] w-[38%] align-top',
        render: (_value, role) => (
            <div className="text-muted-foreground text-sm leading-relaxed break-words whitespace-normal">
                {role.description?.trim() ? role.description : <span className="italic">—</span>}
            </div>
        ),
    },
    {
        key: 'permissions',
        label: 'Permissions',
        sortable: false,
        visible: visibleColumns.permissions,
        headerClassName: 'min-w-[9rem]',
        cellClassName: 'min-w-[9rem]',
        render: (value, role) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewPermissions(role)}
                className="h-auto p-1 text-xs text-primary hover:text-primary hover:underline"
            >
                <Eye className="mr-1 h-3 w-3" />
                {role.permissions?.length || 0} permission{role.permissions?.length !== 1 ? 's' : ''}
            </Button>
        ),
    },
    {
        key: 'users',
        label: 'Users',
        sortable: false,
        visible: visibleColumns.users,
        headerClassName: 'min-w-[8rem]',
        cellClassName: 'min-w-[8rem]',
        render: (value, role) => (
            <div className="overflow-visible text-sm break-words whitespace-normal">
                {role.users && role.users.length > 0 ? (
                    role.users.map((user) => user.name).join(', ')
                ) : (
                    <span className="text-muted-foreground italic">No users assigned</span>
                )}
            </div>
        ),
    },
    createSpacerColumn<Role>(),
    createCreatedAtColumn<Role>({ visibleColumns }),
    createUpdatedAtColumn<Role>({ visibleColumns }),
    createActiveStatusColumn<Role>({
        visibleColumns,
    }),
    createActionsColumn<Role>({
        visibleColumns,
        render: (role) => {
            const isSystemRole = ['admin', 'customer'].includes(role.name);
            const deleteAllowed = parseTruthyFlag(role.is_deleteble);
            const deleteDisabled = !deleteAllowed || isSystemRole;
            const deleteTooltip = !deleteAllowed
                ? 'Deleting this role is disabled'
                : 'System roles (admin, customer) cannot be deleted';

            return (
                <>
                    {can.role_toggle_active && (
                        <ToggleActiveButton
                            isActive={Boolean(role.is_active ?? role.active)}
                            onClick={() => onToggleActive(role)}
                            disabled={isToggleLocked(role)}
                            disabledTooltip="This role cannot change its status"
                        />
                    )}
                    {can.role_show && <ViewButton href={route('roles.show', role.id)} />}
                    {can.role_edit && <EditButton href={route('roles.edit', role.id)} />}
                    {can.role_destroy &&
                        (deleteDisabled ? (
                            <DisabledDeleteButton tooltip={deleteTooltip} />
                        ) : (
                            <DeleteButton onClick={() => onDelete(role)} />
                        ))}
                </>
            );
        },
    }),
];
