import { createCreatedAtColumn, createUpdatedAtColumn, type DataTableColumn } from '@/components/custom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ActivityLog } from '@/types';

interface LogProperties {
    ip_address?: string;
    user_agent?: string;
    browser?: string;
    browser_version?: string;
    os?: string;
    os_version?: string;
    device_type?: string;
    referer?: string;
    execution_time?: number;
    memory_usage?: number;
    response_status?: number;
    request_size?: number;
    method?: string;
    url?: string;
    query_string?: string;
    route_name?: string;
    [key: string]: unknown;
}

interface GetLogColumnsParams {
    getEventBadgeVariant: (event: string) => 'default' | 'secondary' | 'destructive' | 'outline';
    getSubjectTypeName: (subjectType: string) => string;
}

export const getLogColumns = ({ getEventBadgeVariant, getSubjectTypeName }: GetLogColumnsParams): DataTableColumn<ActivityLog>[] => [
    createCreatedAtColumn<ActivityLog>({}),
    createUpdatedAtColumn<ActivityLog>({}),
    {
        key: 'description',
        label: 'Description',
        sortable: true,
        visible: true,
        render: (value, log) => <div className="font-medium">{log.description}</div>,
    },
    {
        key: 'subject_type',
        label: 'Subject',
        sortable: true,
        visible: true,
        render: (value, log) => (
            <div>
                <div className="text-sm font-medium">{getSubjectTypeName(log.subject_type ?? '')}</div>
                <div className="text-xs text-muted-foreground">ID: {log.subject_id}</div>
            </div>
        ),
    },
    {
        key: 'causer_type',
        label: 'User',
        sortable: false,
        visible: true,
        render: (value, log) => (
            <div>
                <div className="text-sm">{log.causer_type ? getSubjectTypeName(log.causer_type ?? '') : 'System'}</div>
                <div className="text-xs text-muted-foreground">ID: {log.causer_id || 'N/A'}</div>
            </div>
        ),
    },
    {
        key: 'event',
        label: 'Event',
        sortable: true,
        visible: true,
        render: (value, log) => {
            const event = String(log.event || '').toLowerCase();
            const className =
                event === 'info'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : event === 'warning'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : undefined;

            return (
                <Badge variant={getEventBadgeVariant(String(log.event ?? ''))} className={className}>
                    {log.event}
                </Badge>
            );
        },
    },
    {
        key: 'properties',
        label: 'Changes',
        sortable: false,
        visible: true,
        render: (value, log) =>
            log.properties && Object.keys(log.properties).length > 0 ? (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            {Object.keys(log.properties).length} changes
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Change Details</DialogTitle>
                            <DialogDescription>
                                Changes made to {getSubjectTypeName(log.subject_type ?? '')} (ID: {log.subject_id})
                            </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-96 overflow-y-auto">
                            <div className="space-y-4">
                                {log.properties && (
                                    <>
                                        {/* Basic Info */}
                                        {((log.properties as LogProperties)?.ip_address || (log.properties as LogProperties)?.user_agent) && (
                                            <div className="rounded-md bg-gray-50 p-3">
                                                <h4 className="mb-2 text-sm font-semibold">🌐 Network & Browser</h4>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    {(log.properties as LogProperties)?.ip_address && (
                                                        <div>
                                                            <strong>IP:</strong> {(log.properties as LogProperties).ip_address}
                                                        </div>
                                                    )}
                                                    {(log.properties as LogProperties)?.browser && (
                                                        <div>
                                                            <strong>Browser:</strong> {(log.properties as LogProperties).browser}{' '}
                                                            {(log.properties as LogProperties).browser_version || ''}
                                                        </div>
                                                    )}
                                                    {(log.properties as LogProperties)?.os && (
                                                        <div>
                                                            <strong>OS:</strong> {(log.properties as LogProperties).os}{' '}
                                                            {(log.properties as LogProperties).os_version || ''}
                                                        </div>
                                                    )}
                                                    {(log.properties as LogProperties)?.device_type && (
                                                        <div>
                                                            <strong>Device:</strong> {(log.properties as LogProperties).device_type}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Request Info */}
                                        {((log.properties as LogProperties)?.method || (log.properties as LogProperties)?.url) && (
                                            <div className="rounded-md bg-blue-50 p-3">
                                                <h4 className="mb-2 text-sm font-semibold">📡 Request Info</h4>
                                                <div className="grid grid-cols-1 gap-2 text-xs">
                                                    {(log.properties as LogProperties)?.method && (log.properties as LogProperties)?.url && (
                                                        <div>
                                                            <strong>Endpoint:</strong> {(log.properties as LogProperties).method}{' '}
                                                            {(log.properties as LogProperties).url}
                                                        </div>
                                                    )}
                                                    {(log.properties as LogProperties)?.route_name && (
                                                        <div>
                                                            <strong>Route:</strong> {(log.properties as LogProperties).route_name}
                                                        </div>
                                                    )}
                                                    {(log.properties as LogProperties)?.query_string && (
                                                        <div>
                                                            <strong>Query:</strong> {(log.properties as LogProperties).query_string}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Performance Metrics */}
                                        {((log.properties as LogProperties)?.execution_time || (log.properties as LogProperties)?.memory_usage) && (
                                            <div className="rounded-md bg-green-50 p-3">
                                                <h4 className="mb-2 text-sm font-semibold">⚡ Performance</h4>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    {(log.properties as LogProperties)?.execution_time && (
                                                        <div>
                                                            <strong>Execution Time:</strong> {(log.properties as LogProperties).execution_time}ms
                                                        </div>
                                                    )}
                                                    {(log.properties as LogProperties)?.memory_usage && (
                                                        <div>
                                                            <strong>Memory:</strong>{' '}
                                                            {((log.properties as LogProperties).memory_usage! / 1024 / 1024).toFixed(2)} MB
                                                        </div>
                                                    )}
                                                    {(log.properties as LogProperties)?.response_status && (
                                                        <div>
                                                            <strong>Status:</strong> {(log.properties as LogProperties).response_status}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* All Properties */}
                                        <div className="rounded-md bg-gray-50 p-3">
                                            <h4 className="mb-2 text-sm font-semibold">📋 All Properties</h4>
                                            <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-xs">
                                                {JSON.stringify(log.properties, null, 2)}
                                            </pre>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            ) : (
                <span className="text-xs text-muted-foreground">No changes</span>
            ),
    },
];
