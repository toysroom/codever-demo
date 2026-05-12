import { CreatedAtContent, UpdatedAtContent } from '@/components/custom/admin-ui';
import { cn } from '@/lib/utils';
import type { DataTableColumn } from '@/types';
import type { ReactNode } from 'react';

type ActiveRow = {
    id: number;
    active?: boolean;
    is_active?: boolean;
};

export function createActiveStatusColumn<T extends ActiveRow>(options: {
    visibleColumns: Record<string, boolean>;
}): DataTableColumn<T> {
    const { visibleColumns } = options;

    return {
        key: 'active',
        label: 'Attivo',
        sortable: true,
        visible: visibleColumns.active ?? true,
        headerAlign: 'right',
        cellAlign: 'right',
        render: (_value, row) => {
            const active = row.active ?? row.is_active ?? false;

            return (
                <div className="flex justify-end">
                    <span
                        className={cn(
                            'inline-flex rounded-md px-2.5 py-1 text-xs font-medium',
                            active
                                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                                : 'bg-muted text-muted-foreground',
                        )}
                    >
                        {active ? 'Attivo' : 'Disattivo'}
                    </span>
                </div>
            );
        },
    };
}

type TimestampRow = {
    created_at?: string | null;
};

export function createCreatedAtColumn<T extends TimestampRow>(options: {
    visibleColumns?: Record<string, boolean>;
    label?: string;
    key?: string;
}): DataTableColumn<T> {
    const { visibleColumns, label = 'Creato', key = 'created_at' } = options;
    const vis =
        visibleColumns === undefined
            ? true
            : (visibleColumns[key] ?? visibleColumns.created_at ?? true);

    return {
        key,
        label,
        sortable: true,
        visible: vis,
        headerAlign: 'right',
        cellAlign: 'right',
        render: (_value, row) => <CreatedAtContent date={String(row.created_at ?? '')} />,
    };
}

type UpdatedRow = {
    updated_at?: string | null;
};

export function createUpdatedAtColumn<T extends UpdatedRow>(options: {
    visibleColumns?: Record<string, boolean>;
    label?: string;
    key?: string;
}): DataTableColumn<T> {
    const { visibleColumns, label = 'Aggiornato', key = 'updated_at' } = options;
    const vis =
        visibleColumns === undefined
            ? true
            : (visibleColumns[key] ?? visibleColumns.updated_at ?? true);

    return {
        key,
        label,
        sortable: true,
        visible: vis,
        headerAlign: 'right',
        cellAlign: 'right',
        render: (_value, row) => <UpdatedAtContent date={String(row.updated_at ?? '')} />,
    };
}

/** Colonna vuota che espande per spingere a destra date/stato/azioni. */
export function createSpacerColumn<T>(options?: { visible?: boolean }): DataTableColumn<T> {
    const visible = options?.visible ?? true;

    return {
        key: 'spacer',
        label: '',
        sortable: false,
        visible,
        render: () => null,
        headerClassName: 'w-full',
        cellClassName: 'w-full',
    };
}

/** Colonna azioni allineata a destra con contenuto custom (pulsanti tabella). */
export function createActionsColumn<T>(options: {
    visibleColumns?: Record<string, boolean>;
    label?: string;
    /** Chiave colonna (default `actions`) per visibilità in `visibleColumns`. */
    columnKey?: string;
    render: (row: T) => ReactNode;
    headerClassName?: string;
    cellClassName?: string;
}): DataTableColumn<T> {
    const {
        visibleColumns,
        label = 'Actions',
        render,
        headerClassName = 'w-[200px] whitespace-nowrap',
        cellClassName = 'w-[200px] whitespace-nowrap',
        columnKey = 'actions',
    } = options;
    const vis =
        visibleColumns === undefined
            ? true
            : (visibleColumns[columnKey] ?? visibleColumns.actions ?? true);

    return {
        key: columnKey,
        label,
        sortable: false,
        visible: vis,
        headerAlign: 'right',
        cellAlign: 'right',
        headerClassName,
        cellClassName,
        render: (_value, row) => <div className="flex items-center justify-end space-x-2">{render(row)}</div>,
    };
}

/** Interpreta flag “cancellabile” da API (bool/num/string). */
export function parseTruthyFlag(value: unknown): boolean {
    if (value === undefined || value === null) {
        return true;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'number') {
        return value === 1;
    }
    const normalized = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes'].includes(normalized)) {
        return true;
    }
    if (['0', 'false', 'no'].includes(normalized)) {
        return false;
    }

    return true;
}
