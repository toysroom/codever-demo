import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { DataTableColumn, DataTablePagination } from '@/types';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Columns3, ChevronsUpDown } from 'lucide-react';
import { type ReactNode, useCallback, useMemo, useState } from 'react';

const DEFAULT_PER_PAGE_OPTIONS = [10, 15, 20, 25, 50, 100] as const;

function dataTableRowId<T>(row: T, index: number): string {
    if (row && typeof row === 'object' && 'id' in row && (row as { id?: unknown }).id != null && (row as { id?: unknown }).id !== '') {
        return String((row as { id: string | number }).id);
    }
    return `__idx-${index}`;
}

type DataTableProps<T> = {
    data: T[];
    columns: DataTableColumn<T>[];
    pagination: DataTablePagination;
    emptyMessage?: string;
    columnToggleButtonLabel?: string;
    currentPerPage?: number;
    perPageOptions?: readonly number[];
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    onColumnToggle?: (key: string, visible: boolean) => void;
    onSort?: (field: string, order: 'asc' | 'desc') => void;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    /** Colonna checkbox + “seleziona tutti” (righe della pagina corrente). Default: true. */
    enableRowSelection?: boolean;
    /** Notifica ogni cambio di selezione (id come stringa). */
    onSelectionChange?: (selectedIds: ReadonlySet<string>) => void;
};

function getCellValue<T>(row: T, key: string): unknown {
    if (row && typeof row === 'object' && key in (row as object)) {
        return (row as Record<string, unknown>)[key];
    }

    return undefined;
}

function SortGlyph({ active, order }: { active: boolean; order: 'asc' | 'desc' | null }) {
    if (!active || !order) {
        return <ChevronsUpDown className="text-muted-foreground size-3.5 shrink-0 opacity-50" />;
    }
    return order === 'asc' ? (
        <ChevronUp className="text-primary size-3.5 shrink-0" />
    ) : (
        <ChevronDown className="text-primary size-3.5 shrink-0" />
    );
}

export function DataTable<T extends { id?: number | string }>({
    data,
    columns,
    pagination,
    emptyMessage = 'No records found.',
    columnToggleButtonLabel = 'Personalizza colonne',
    currentPerPage,
    perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
    onPageChange,
    onPerPageChange,
    onColumnToggle,
    onSort,
    sortField,
    sortOrder,
    enableRowSelection = true,
    onSelectionChange,
}: DataTableProps<T>) {
    const visibleCols = useMemo(() => columns.filter((c) => c.visible !== false), [columns]);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

    const pageRowMeta = useMemo(
        () => data.map((row, idx) => ({ row, idx, id: dataTableRowId(row, idx) })),
        [data],
    );

    const pageIds = useMemo(() => pageRowMeta.map((m) => m.id), [pageRowMeta]);

    const updateSelection = useCallback(
        (next: Set<string>) => {
            setSelectedIds(next);
            onSelectionChange?.(next);
        },
        [onSelectionChange],
    );

    const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    const someOnPageSelected = pageIds.some((id) => selectedIds.has(id)) && !allOnPageSelected;

    const headerCheckboxState: boolean | 'indeterminate' = allOnPageSelected
        ? true
        : someOnPageSelected
          ? 'indeterminate'
          : false;

    const togglePageSelection = () => {
        const next = new Set(selectedIds);
        if (allOnPageSelected) {
            pageIds.forEach((id) => next.delete(id));
        } else {
            pageIds.forEach((id) => next.add(id));
        }
        updateSelection(next);
    };

    const toggleRow = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        updateSelection(next);
    };

    const effectivePerPage = currentPerPage ?? pagination.per_page;
    const showFooter = Boolean(onPageChange && onPerPageChange);
    const selectionCol = enableRowSelection;
    const colCount = visibleCols.length + (selectionCol ? 1 : 0);

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-end gap-2">
                {onColumnToggle ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="outline" size="sm">
                                <Columns3 className="mr-2 size-4" />
                                {columnToggleButtonLabel}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                            {columns
                                .filter((c) => c.key !== 'actions' && c.key !== 'spacer')
                                .map((col) => (
                                    <DropdownMenuCheckboxItem
                                        key={col.key}
                                        checked={col.visible !== false}
                                        onCheckedChange={(v) => onColumnToggle(col.key, Boolean(v))}
                                    >
                                        {col.label || col.key}
                                    </DropdownMenuCheckboxItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null}
            </div>

            <div className="overflow-x-auto rounded-md border border-sidebar-border/70 dark:border-sidebar-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {selectionCol ? (
                                <TableHead className="w-10 max-w-10 px-2">
                                    <Checkbox
                                        checked={headerCheckboxState}
                                        onCheckedChange={() => togglePageSelection()}
                                        aria-label="Seleziona tutte le righe di questa pagina"
                                    />
                                </TableHead>
                            ) : null}
                            {visibleCols.map((col) => (
                                <TableHead
                                    key={col.key}
                                    className={cn(col.headerClassName, col.headerAlign === 'right' && 'text-right')}
                                >
                                    {col.sortable && onSort ? (
                                        <button
                                            type="button"
                                            className={cn(
                                                'text-foreground hover:text-primary inline-flex items-center gap-1 rounded-sm font-medium',
                                                col.headerAlign === 'right' && 'ml-auto',
                                            )}
                                            onClick={() => {
                                                const nextOrder =
                                                    sortField === col.key && sortOrder === 'asc' ? 'desc' : 'asc';
                                                onSort(col.key, nextOrder);
                                            }}
                                        >
                                            {col.label}
                                            <SortGlyph
                                                active={sortField === col.key}
                                                order={sortField === col.key ? sortOrder ?? null : null}
                                            />
                                        </button>
                                    ) : (
                                        col.label
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={colCount} className="text-muted-foreground h-24 text-center">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            pageRowMeta.map(({ row, id: rowId }) => (
                                <TableRow key={rowId}>
                                    {selectionCol ? (
                                        <TableCell
                                            className="w-10 max-w-10 px-2"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Checkbox
                                                checked={selectedIds.has(rowId)}
                                                onCheckedChange={() => toggleRow(rowId)}
                                                aria-label="Seleziona riga"
                                            />
                                        </TableCell>
                                    ) : null}
                                    {visibleCols.map((col) => {
                                        const raw = getCellValue(row, col.key);
                                        const content: ReactNode = col.render ? col.render(raw, row) : String(raw ?? '');

                                        return (
                                            <TableCell
                                                key={col.key}
                                                className={cn(
                                                    col.cellClassName,
                                                    col.cellAlign === 'right' && 'text-right',
                                                )}
                                            >
                                                {content}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {showFooter ? (
                <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-3 border-t border-sidebar-border/60 pt-3 text-sm dark:border-sidebar-border">
                    <p>
                        {(pagination.total ?? 0) > 0
                            ? pagination.from != null && pagination.to != null
                                ? `Mostra da ${pagination.from} a ${pagination.to} di ${pagination.total}`
                                : `Totale ${pagination.total} elementi`
                            : 'Nessun elemento'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground whitespace-nowrap">Righe</span>
                            <Select
                                value={String(effectivePerPage)}
                                onValueChange={(v) => onPerPageChange?.(Number(v))}
                            >
                                <SelectTrigger className="h-9 w-[4.75rem]" aria-label="Righe per pagina">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {perPageOptions.map((n) => (
                                        <SelectItem key={n} value={String(n)}>
                                            {n}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-9"
                                disabled={(pagination.last_page ?? 1) <= 1 || pagination.current_page <= 1}
                                aria-label="Pagina precedente"
                                onClick={() => onPageChange?.(pagination.current_page - 1)}
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <span className="text-foreground shrink-0 font-medium whitespace-nowrap">
                                Pag. {pagination.current_page} di {pagination.last_page || 1}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-9"
                                disabled={(pagination.last_page ?? 1) <= 1 || pagination.current_page >= pagination.last_page}
                                aria-label="Pagina successiva"
                                onClick={() => onPageChange?.(pagination.current_page + 1)}
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
