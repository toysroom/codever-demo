import { DataTablePagination, PageActions, pageSearchFiltersPanelClassName } from '@/components/custom';
import { cn } from '@/lib/utils';
import DeleteConfirmationModal from '@/components/custom/delete-confirmation-modal';
import { DataTable } from '@/components/custom/data-table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useDeleteConfirmation, useFlashMessages } from '@/hooks';
import PageLayout from '@/layouts/page-layout';
import { ActivityLog, BreadcrumbItem, PageProps } from '@/types';
import { router } from '@inertiajs/react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getLogColumns } from './columns';

interface LogsIndexProps extends PageProps {
    logs: {
        data: ActivityLog[];
        pagination: DataTablePagination;
    };
    filters: {
        search?: string;
        sort_field?: string;
        sort_order?: string;
        log_filter?: string;
    };
    lang: Record<string, string>;
    can: {
        log_index: boolean;
        log_destroy_all: boolean;
    };
    storageLogFiles: { name: string; content: string }[];
}

function storageLogTabValue(fileName: string): string {
    return `file:${fileName}`;
}

export default function LogsPage({ logs, filters = {}, can, lang, storageLogFiles = [] }: LogsIndexProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: lang.breadcrumb_dashboard, href: route('dashboard') },
        { title: lang.breadcrumb_logs, href: route('logs.index') },
    ];
    
    const [isWatching, setIsWatching] = useState(false);
    const { isConfirmingDelete, confirmDelete, executeDelete, cancelDelete } = useDeleteConfirmation();
    
    useFlashMessages();

    const currentFilter = filters.log_filter || 'all';

    const handleFilterChange = (value: string) => {
        router.get(route('logs.index'), { log_filter: value }, { preserveState: true });
    };

    // Auto-refresh ogni 5 secondi quando il watch è attivo
    useEffect(() => {
        if (!isWatching) return;

        const interval = setInterval(() => {
            const params = new URLSearchParams(window.location.search);
            router.visit(route('logs.index') + (params.toString() ? `?${params.toString()}` : ''), {
                preserveState: true,
                preserveScroll: true,
                only: ['logs', 'storageLogFiles'],
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [isWatching]);

    const handleDeleteAllClick = () => {
        confirmDelete(() => {
            router.delete(route('logs.destroy-all'), {
                preserveScroll: true,
                onSuccess: () => cancelDelete(),
            });
        });
    };

    const getEventBadgeVariant = (event: string) => {
        switch (event) {
            case 'created':
                return 'default';
            case 'updated':
                return 'secondary';
            case 'deleted':
                return 'destructive';
            case 'info':
                return 'outline';
            case 'warning':
                return 'outline';
            case 'error':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const getSubjectTypeName = (subjectType: string): string => {
        const typeMap: { [key: string]: string } = {
            'App\\Models\\Customer': 'Customer',
            'App\\Models\\Supplier': 'Supplier',
            'App\\Models\\User': 'User',
            'App\\Models\\Preference': 'Preference',
            'App\\Models\\Country': 'Country',
            'App\\Models\\CustomerShipping': 'Customer Shipping',
        };
        return typeMap[subjectType] || (subjectType ? (subjectType.split('\\').pop() ?? 'Unknown') : 'Unknown');
    };

    // Define table columns
    const columns = getLogColumns({
        getEventBadgeVariant,
        getSubjectTypeName,
    });

    return (
        <PageLayout
            title={lang.index_title || 'Activity Logs'}
            description={lang.index_description || 'View all system activity and changes.'}
            breadcrumbs={breadcrumbs}
            headerActions={
                <PageActions>
                    <Button variant={isWatching ? 'default' : 'outline'} onClick={() => setIsWatching(!isWatching)}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isWatching ? 'animate-spin' : ''}`} />
                        {isWatching ? 'Stop Watch' : 'Start Watch'}
                    </Button>
                    {can.log_destroy_all && (
                        <Button variant="destructive" onClick={handleDeleteAllClick}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete All Logs
                        </Button>
                    )}
                </PageActions>
            }
        >
            {can.log_destroy_all && (
                <DeleteConfirmationModal
                    isOpen={isConfirmingDelete}
                    onClose={cancelDelete}
                    onConfirm={executeDelete}
                    title={lang.delete_all_title || 'Delete All Activity Logs'}
                    description={
                        lang.delete_all_description ||
                        'This action will permanently delete all activity logs from the system. This action cannot be undone. Are you sure you want to continue?'
                    }
                    confirmText={lang.delete_all_confirm || 'Delete All Logs'}
                    lang={lang}
                />
            )}
            <Tabs defaultValue="activity" className="w-full">
                <TabsList className="h-auto w-full min-h-10 flex flex-wrap justify-start gap-1 overflow-x-auto p-1">
                    <TabsTrigger value="activity">{lang.tab_activity_log || 'Activity log'}</TabsTrigger>
                    {storageLogFiles.map((f) => (
                        <TabsTrigger key={f.name} value={storageLogTabValue(f.name)} className="max-w-[14rem] shrink-0 truncate" title={f.name}>
                            {f.name}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="activity" className="mt-4 space-y-4">
                    <div className={cn(pageSearchFiltersPanelClassName, 'flex flex-wrap items-center gap-4')}>
                        <div className="flex flex-col gap-1">
                            <ToggleGroup
                                type="single"
                                value={currentFilter}
                                onValueChange={(value) => {
                                    if (value) handleFilterChange(value);
                                }}
                                variant="outline"
                                size="sm"
                            >
                                <ToggleGroupItem value="all" aria-label="All">
                                    {lang.filter_all || 'All'}
                                </ToggleGroupItem>
                                <ToggleGroupItem value="with_event" aria-label="With Event">
                                    {lang.filter_with_event || 'With Event'}
                                </ToggleGroupItem>
                                <ToggleGroupItem value="user_accessed" aria-label="User Accessed">
                                    {lang.filter_user_accessed || 'User Accessed'}
                                </ToggleGroupItem>
                            </ToggleGroup>
                            <p className="text-xs text-muted-foreground">{lang.filter_label || 'Filter'}</p>
                        </div>
                    </div>

                    <DataTable data={logs.data} columns={columns} pagination={logs.pagination} emptyMessage={lang.empty} />
                </TabsContent>

                {storageLogFiles.map((f) => (
                    <TabsContent key={f.name} value={storageLogTabValue(f.name)} className="mt-4">
                        <p className="text-xs text-muted-foreground mb-2">
                            {lang.storage_log_file_hint || 'Last 500 lines (tail).'}
                        </p>
                        <div className="rounded-md border bg-muted/30 p-0">
                            <pre
                                className="max-h-[min(32rem,70vh)] overflow-auto p-4 text-left font-mono text-xs leading-relaxed whitespace-pre-wrap break-words"
                                dir="ltr"
                            >
                                {f.content || lang.storage_log_file_empty || '(empty)'}
                            </pre>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </PageLayout>
    );
}
