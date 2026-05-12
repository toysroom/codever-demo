import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageLayout from '@/layouts/page-layout';
import { PageProps, type BreadcrumbItem } from '@/types';
import { Database, Monitor, Server, Settings } from 'lucide-react';

interface InfoIndexProps extends PageProps {
    phpInfo: {
        version: string;
        sapi: string;
        memory_limit: string;
        max_execution_time: string;
        upload_max_filesize: string;
        post_max_size: string;
        timezone: string;
        proc_open_available: boolean;
        proc_open_disabled?: boolean;
        proc_close_available: boolean;
        proc_close_disabled?: boolean;
        disabled_functions?: string[];
        extensions: Record<string, boolean>;
    };
    serverInfo: {
        software: string;
        operating_system: string;
        server_name: string;
        document_root: string;
        http_host: string;
        request_method: string;
        user_agent: string;
        server_port: string;
    };
    systemInfo: {
        hostname: string;
        load_average: number[];
        memory_usage: {
            current: number;
            peak: number;
            limit: string;
            current_formatted: string;
            peak_formatted: string;
        };
        disk_space: {
            total: number;
            free: number;
            used: number;
            total_formatted: string;
            free_formatted: string;
            used_formatted: string;
        };
    };
    dbInfo: {
        version: string;
        connection: string;
        charset: string;
        collation: string;
        driver: string;
        host: string;
        port: string;
    };
    laravelInfo: {
        version: string;
        environment: string;
        debug: boolean;
        url: string;
        timezone: string;
        locale: string;
        cache_driver: string;
        session_driver: string;
        queue_driver: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'System Info',
        href: route('info.index'),
    },
];

export default function InfoIndex({ phpInfo, serverInfo, systemInfo, dbInfo, laravelInfo }: InfoIndexProps) {
    const InfoCard = ({
        title,
        icon: Icon,
        children,
    }: {
        title: string;
        icon: React.ComponentType<{ className?: string }>;
        children: React.ReactNode;
    }) => (
        <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <Icon className="mr-2 h-5 w-5" />
                <CardTitle className="text-lg font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );

    const InfoRow = ({ label, value }: { label: string; value: string | number | boolean }) => (
        <div className="flex items-center justify-between border-b border-gray-100 py-1 last:border-b-0">
            <span className="text-sm font-medium text-gray-600">{label}:</span>
            <span className="text-sm text-gray-900">
                {typeof value === 'boolean' ? <Badge variant={value ? 'default' : 'destructive'}>{value ? 'Enabled' : 'Disabled'}</Badge> : value}
            </span>
        </div>
    );

    return (
        <PageLayout title="System Information" description="View system information and settings." breadcrumbs={breadcrumbs}>
            <div className="grid gap-6 md:grid-cols-2">
                {/* PHP Information */}
                <InfoCard title="PHP Information" icon={Settings}>
                    <div className="space-y-1">
                        <InfoRow label="Version" value={phpInfo.version} />
                        <InfoRow label="SAPI" value={phpInfo.sapi} />
                        <InfoRow label="Memory Limit" value={phpInfo.memory_limit} />
                        <InfoRow label="Max Execution Time" value={phpInfo.max_execution_time} />
                        <InfoRow label="Upload Max Filesize" value={phpInfo.upload_max_filesize} />
                        <InfoRow label="Post Max Size" value={phpInfo.post_max_size} />
                        <InfoRow label="Timezone" value={phpInfo.timezone} />
                        <InfoRow label="proc_open" value={phpInfo.proc_open_available} />
                        <InfoRow label="proc_close" value={phpInfo.proc_close_available} />
                    </div>
                </InfoCard>
                
                {/* Disabled Functions Warning */}
                {(phpInfo.proc_open_disabled || phpInfo.proc_close_disabled) && (
                    <InfoCard title="⚠️ Funzioni Process Disabilitate" icon={Settings}>
                        <div className="space-y-2 text-sm">
                            <p className="text-red-600 dark:text-red-400">
                                <strong>Una o più funzioni necessarie per i processi sono disabilitate nel php.ini.</strong>
                            </p>
                            {phpInfo.proc_open_disabled && (
                                <p className="text-muted-foreground">
                                    • La funzione <code className="rounded bg-muted px-1 py-0.5">proc_open</code> è disabilitata.
                                </p>
                            )}
                            {phpInfo.proc_close_disabled && (
                                <p className="text-muted-foreground">
                                    • La funzione <code className="rounded bg-muted px-1 py-0.5">proc_close</code> è disabilitata.
                                </p>
                            )}
                            <p className="text-muted-foreground mt-2">
                                Entrambe le funzioni sono necessarie per l'esecuzione dei backup del database. Queste funzioni non possono essere abilitate da un file PHP.
                            </p>
                            <p className="text-muted-foreground">
                                Per risolvere:
                            </p>
                            <ul className="list-disc pl-5 text-muted-foreground">
                                <li>Contattare il provider di hosting per rimuovere <code className="rounded bg-muted px-1 py-0.5">proc_open</code> e <code className="rounded bg-muted px-1 py-0.5">proc_close</code> da <code className="rounded bg-muted px-1 py-0.5">disable_functions</code> in <code className="rounded bg-muted px-1 py-0.5">php.ini</code></li>
                                <li>Se hai accesso, modificare manualmente <code className="rounded bg-muted px-1 py-0.5">php.ini</code> e riavviare il server web/PHP-FPM</li>
                            </ul>
                        </div>
                    </InfoCard>
                )}

                {/* Server Information */}
                <InfoCard title="Server Information" icon={Server}>
                    <div className="space-y-1">
                        <InfoRow label="Software" value={serverInfo.software} />
                        <InfoRow label="OS" value={serverInfo.operating_system} />
                        <InfoRow label="Server Name" value={serverInfo.server_name} />
                        <InfoRow label="HTTP Host" value={serverInfo.http_host} />
                        <InfoRow label="Port" value={serverInfo.server_port} />
                        <InfoRow label="Request Method" value={serverInfo.request_method} />
                    </div>
                </InfoCard>

                {/* Database Information */}
                <InfoCard title="Database Information" icon={Database}>
                    <div className="space-y-1">
                        <InfoRow label="Version" value={dbInfo.version} />
                        <InfoRow label="Driver" value={dbInfo.driver} />
                        <InfoRow label="Database" value={dbInfo.connection} />
                        <InfoRow label="Host" value={dbInfo.host} />
                        <InfoRow label="Port" value={dbInfo.port} />
                        <InfoRow label="Charset" value={dbInfo.charset} />
                        <InfoRow label="Collation" value={dbInfo.collation} />
                    </div>
                </InfoCard>

                {/* Laravel Information */}
                <InfoCard title="Laravel Information" icon={Monitor}>
                    <div className="space-y-1">
                        <InfoRow label="Version" value={laravelInfo.version} />
                        <InfoRow label="Environment" value={laravelInfo.environment} />
                        <InfoRow label="Debug Mode" value={laravelInfo.debug} />
                        <InfoRow label="URL" value={laravelInfo.url} />
                        <InfoRow label="Timezone" value={laravelInfo.timezone} />
                        <InfoRow label="Locale" value={laravelInfo.locale} />
                        <InfoRow label="Cache Driver" value={laravelInfo.cache_driver} />
                        <InfoRow label="Session Driver" value={laravelInfo.session_driver} />
                        <InfoRow label="Queue Driver" value={laravelInfo.queue_driver} />
                    </div>
                </InfoCard>
            </div>

            {/* System Resources */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Memory Usage */}
                <InfoCard title="Memory Usage" icon={Monitor}>
                    <div className="space-y-1">
                        <InfoRow label="Current Usage" value={systemInfo.memory_usage.current_formatted} />
                        <InfoRow label="Peak Usage" value={systemInfo.memory_usage.peak_formatted} />
                        <InfoRow label="Memory Limit" value={systemInfo.memory_usage.limit} />
                    </div>
                </InfoCard>

                {/* Disk Space */}
                <InfoCard title="Disk Space" icon={Monitor}>
                    <div className="space-y-1">
                        <InfoRow label="Total Space" value={systemInfo.disk_space.total_formatted} />
                        <InfoRow label="Free Space" value={systemInfo.disk_space.free_formatted} />
                        <InfoRow label="Used Space" value={systemInfo.disk_space.used_formatted} />
                    </div>
                </InfoCard>
            </div>

            {/* PHP Extensions */}
            <InfoCard title="PHP Extensions" icon={Settings}>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {Object.entries(phpInfo.extensions).map(([extension, enabled]) => (
                        <div key={extension} className="flex items-center space-x-2">
                            <Badge variant={enabled ? 'default' : 'destructive'}>{extension}</Badge>
                        </div>
                    ))}
                </div>
            </InfoCard>

            {/* Disabled Functions */}
            <InfoCard title="Funzioni PHP Disabilitate" icon={Settings}>
                <div className="space-y-2">
                    {phpInfo.disabled_functions && phpInfo.disabled_functions.length > 0 ? (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Le seguenti funzioni sono disabilitate in <code className="rounded bg-muted px-1 py-0.5">disable_functions</code> nel <code className="rounded bg-muted px-1 py-0.5">php.ini</code>:
                            </p>
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                {phpInfo.disabled_functions.map((func) => (
                                    <div key={func} className="flex items-center space-x-2">
                                        <Badge variant={func === 'proc_open' ? 'destructive' : 'secondary'}>{func}</Badge>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Nessuna funzione disabilitata. Il valore di <code className="rounded bg-muted px-1 py-0.5">disable_functions</code> è vuoto o non configurato.
                        </p>
                    )}
                </div>
            </InfoCard>

            {/* System Load */}
            <InfoCard title="System Load" icon={Monitor}>
                <div className="space-y-1">
                    <InfoRow label="Hostname" value={systemInfo.hostname} />
                    <InfoRow label="Load Average (1min)" value={systemInfo.load_average[0]?.toFixed(2) || 'N/A'} />
                    <InfoRow label="Load Average (5min)" value={systemInfo.load_average[1]?.toFixed(2) || 'N/A'} />
                    <InfoRow label="Load Average (15min)" value={systemInfo.load_average[2]?.toFixed(2) || 'N/A'} />
                </div>
            </InfoCard>
        </PageLayout>
    );
}
