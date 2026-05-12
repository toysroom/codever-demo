import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DeleteConfirmationModal from '@/components/custom/delete-confirmation-modal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDeleteConfirmation } from '@/hooks';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import PageLayout from '@/layouts/page-layout';
import { BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { AlertTriangle, CheckCircle, Clock, Cloud, Database, Download, File, HardDrive, RefreshCw, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface BackupDestination {
    name: string;
    disk: string;
    path_prefix?: string;
    backups: Backup[];
    isReachable: boolean;
    usedStorage: number;
    totalBackups: number;
    newestBackup: Backup | null;
    oldestBackup: Backup | null;
    error?: string;
}

interface Backup {
    path: string;
    size: string;
    sizeInBytes: number;
    date: string;
    age: string;
    isEncrypted: boolean;
}

interface HealthCheck {
    destination: string;
    checks: {
        maxAge: {
            status: 'pass' | 'fail';
            message: string;
        };
        maxStorage: {
            status: 'pass' | 'fail';
            message: string;
        };
    };
}

interface BackupStats {
    totalBackups: number;
    totalSize: string;
    totalSizeInBytes: number;
    newestBackup: Backup | null;
    oldestBackup: Backup | null;
    destinationsCount: number;
}

interface BackupMonitorProps {
    backupDestinations: Record<string, BackupDestination>;
    backupStats: BackupStats;
    healthChecks: HealthCheck[];
    can: {
        backup_monitor_index: boolean;
        backup_run: boolean;
        backup_clean: boolean;
        backup_download: boolean;
        backup_delete: boolean;
        backup_status: boolean;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Backup Monitor', href: route('backup-monitor.index') },
];

export default function BackupMonitor({ backupDestinations, backupStats, can }: BackupMonitorProps) {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [backupInProgress, setBackupInProgress] = useState(false);
    const [backupType, setBackupType] = useState<'full' | 'db' | 'files' | null>(null);
    const [showCleanDialog, setShowCleanDialog] = useState(false);
    const [backupToDelete, setBackupToDelete] = useState<{ disk: string; path: string } | null>(null);
    const { isConfirmingDelete, confirmDelete, executeDelete, cancelDelete } = useDeleteConfirmation();
    const [backupLogKey, setBackupLogKey] = useState<string | null>(null);
    const [backupLogs, setBackupLogs] = useState<string>('');
    const [showLogsDialog, setShowLogsDialog] = useState(false);
    const [backupPath, setBackupPath] = useState<string | null>(null);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const runBackup = async (type: 'full' | 'db' | 'files' = 'full') => {
        setLoading(true);
        setBackupInProgress(true);
        setBackupType(type);
        setBackupLogs('');
        setBackupPath(null);
        setShowLogsDialog(true);

        try {
            const response = await fetch(route('backup-monitor.run'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    only_db: type === 'db',
                    only_files: type === 'files',
                }),
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 200)}`);
            }

            const data = await response.json();

            if (data.success) {
                toast.success('Backup completato con successo!');
                if (data.log_key) {
                    setBackupLogKey(data.log_key);
                }
                if (data.backup_path) {
                    setBackupPath(data.backup_path);
                }
                // Start monitoring backup progress (though it should be done already)
                if (data.log_key) {
                    startBackupMonitoring(data.log_key);
                }
            } else {
                toast.error(data.message || "Si è verificato un errore durante l'avvio del backup.");
                setBackupInProgress(false);
                setBackupType(null);
                setShowLogsDialog(false);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Si è verificato un errore durante l'avvio del backup.";
            toast.error(errorMessage);
            setBackupInProgress(false);
            setBackupType(null);
            setShowLogsDialog(false);
        } finally {
            setLoading(false);
        }
    };

    const cleanBackups = () => {
        setShowCleanDialog(true);
    };

    const confirmCleanBackups = async () => {
        setLoading(true);
        setShowCleanDialog(false);
        try {
            await router.post(
                route('backup-monitor.clean'),
                {},
                {
                    onSuccess: () => {
                        toast.success('I backup vecchi sono stati eliminati con successo.');
                        router.reload();
                    },
                    onError: () => {
                        toast.error('Si è verificato un errore durante la pulizia dei backup.');
                    },
                },
            );
        } catch (error) {
            toast.error('Si è verificato un errore durante la pulizia dei backup.');
        } finally {
            setLoading(false);
        }
    };

    const downloadBackup = (disk: string, path: string) => {
        const url = new URL(route('backup-monitor.download'), window.location.origin);
        url.searchParams.append('disk', disk);
        url.searchParams.append('path', path);
        window.open(url.toString(), '_blank');
    };

    const deleteBackup = (disk: string, path: string) => {
        setBackupToDelete({ disk, path });
        confirmDelete(() => {
            router.delete(route('backup-monitor.delete'), {
                data: { disk, path },
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Il backup è stato eliminato con successo.');
                    cancelDelete();
                    setBackupToDelete(null);
                    router.reload();
                },
                onError: () => {
                    toast.error("Si è verificato un errore durante l'eliminazione del backup.");
                    cancelDelete();
                    setBackupToDelete(null);
                },
            });
        });
    };

    const handleCloseDeleteModal = () => {
        cancelDelete();
        setBackupToDelete(null);
    };

    const refreshData = async () => {
        setRefreshing(true);
        toast.info('Aggiornamento dati in corso...');
        try {
            await router.reload({
                onSuccess: () => {
                    toast.success('Dati aggiornati con successo!');
                },
                onError: () => {
                    toast.error("Errore durante l'aggiornamento dei dati.");
                },
                onFinish: () => {
                    setRefreshing(false);
                },
            });
        } catch (error) {
            toast.error("Errore durante l'aggiornamento dei dati.");
            setRefreshing(false);
        }
    };

    const startBackupMonitoring = (logKey?: string) => {
        let checkCount = 0;
        const maxChecks = 100; // Maximum 100 checks (5 minutes at 3-second intervals)

        // Monitor backup progress every 3 seconds
        const interval = setInterval(async () => {
            try {
                checkCount++;

                // Fetch logs if log key is available
                if (logKey) {
                    try {
                        const logsResponse = await fetch(`${route('backup-monitor.logs')}?log_key=${encodeURIComponent(logKey)}`);
                        const logsData = await logsResponse.json();
                        if (logsData.success && logsData.logs) {
                            setBackupLogs(logsData.logs);
                        }
                    } catch (logError) {
                        // Silently fail log fetching
                    }
                }

                // Check backup status via API
                const response = await fetch(route('backup-monitor.status'));
                const status = await response.json();

                if (!status.is_running) {
                    // Backup process is no longer running
                    setBackupInProgress(false);
                    setBackupType(null);
                    clearInterval(interval);

                    // Fetch final logs
                    if (logKey) {
                        try {
                            const logsResponse = await fetch(`${route('backup-monitor.logs')}?log_key=${encodeURIComponent(logKey)}`);
                            const logsData = await logsResponse.json();
                            if (logsData.success && logsData.logs) {
                                setBackupLogs(logsData.logs);
                            }
                        } catch (logError) {
                            // Silently fail log fetching
                        }
                    }

                    // Refresh data to show new backup
                    await router.reload({ only: ['backupStats', 'backupDestinations'] });
                    toast.success('Backup completato con successo!');
                } else if (checkCount >= maxChecks) {
                    // Timeout reached
                    setBackupInProgress(false);
                    setBackupType(null);
                    clearInterval(interval);
                    toast.info('Monitoraggio backup terminato. Controlla manualmente lo stato.');
                }
            } catch (error) {
                console.error('Error monitoring backup:', error);
                checkCount++;

                if (checkCount >= maxChecks) {
                    setBackupInProgress(false);
                    setBackupType(null);
                    clearInterval(interval);
                    toast.error('Errore durante il monitoraggio del backup.');
                }
            }
        }, 3000);
    };

    const getStatusIcon = (isReachable: boolean, hasBackups: boolean) => {
        if (!isReachable) return <XCircle className="h-4 w-4 text-red-500" />;
        if (hasBackups) return <CheckCircle className="h-4 w-4 text-green-500" />;
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    };

    const getStatusText = (isReachable: boolean, hasBackups: boolean) => {
        if (!isReachable) return 'Non raggiungibile';
        if (hasBackups) return 'Attivo';
        return 'Nessun backup';
    };

    const getStatusColor = (isReachable: boolean, hasBackups: boolean) => {
        if (!isReachable) return 'destructive';
        if (hasBackups) return 'default';
        return 'secondary';
    };

    return (
        <PageLayout title="Backup Monitor" description="Gestisci e monitora i backup del sistema. I backup vengono salvati su Dropbox." breadcrumbs={breadcrumbs}>
            <div className="mb-4">
                <Alert>
                    <Cloud className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Backup remoto:</strong> I backup vengono salvati esclusivamente su Dropbox. Assicurati che <code className="rounded bg-muted px-1 py-0.5">DROPBOX_REFRESH_TOKEN</code> sia configurato correttamente nel file <code className="rounded bg-muted px-1 py-0.5">.env</code>
                    </AlertDescription>
                </Alert>
            </div>
            <div className="flex items-center justify-between">
                <Button onClick={refreshData} disabled={refreshing} variant="outline" size="sm">
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Aggiornamento...' : 'Aggiorna'}
                </Button>
            </div>

            {/* Backup Progress Indicator */}
            {backupInProgress && (
                <Alert>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                        <strong>Backup in corso...</strong>
                        {backupType === 'db' && ' Database'}
                        {backupType === 'files' && ' File'}
                        {backupType === 'full' && ' Completo'}
                        {' - Monitoraggio automatico attivo'}
                    </AlertDescription>
                </Alert>
            )}

            {/* Statistics Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Database className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-muted-foreground">Backup Totali</p>
                                <p className="text-2xl font-bold">{backupStats.totalBackups}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <HardDrive className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-muted-foreground">Spazio Utilizzato</p>
                                <p className="text-2xl font-bold">{backupStats.totalSize}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Cloud className="h-8 w-8 text-purple-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-muted-foreground">Destinazioni</p>
                                <p className="text-2xl font-bold">{backupStats.destinationsCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Clock className="h-8 w-8 text-orange-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-muted-foreground">Ultimo Backup</p>
                                <p className="text-2xl font-bold">{backupStats.newestBackup ? backupStats.newestBackup.age : 'Mai'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Azioni Rapide</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        {can.backup_run && (
                            <>
                                <Button onClick={() => runBackup('db')} disabled={loading || backupInProgress} className="flex items-center">
                                    {backupInProgress && backupType === 'db' ? (
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Database className="mr-2 h-4 w-4" />
                                    )}
                                    Solo Database
                                </Button>
                            </>
                        )}
                        {can.backup_clean && (
                            <Button onClick={cleanBackups} disabled={loading || backupInProgress} variant="destructive" className="flex items-center">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Pulisci Vecchi
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Destinations */}
            <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Destinazioni Backup</h2>

                {Object.values(backupDestinations).length === 0 ? (
                    <Empty>
                        <EmptyContent>
                            <EmptyMedia variant="icon">
                                <AlertTriangle />
                            </EmptyMedia>
                            <EmptyTitle>Nessuna destinazione configurata</EmptyTitle>
                            <EmptyDescription>
                                Non ci sono destinazioni di backup configurate. Configura almeno una destinazione per iniziare a salvare i backup.
                            </EmptyDescription>
                        </EmptyContent>
                    </Empty>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {Object.values(backupDestinations).map((destination) => {
                            const hasBackups = destination.backups.length > 0;

                            return (
                                <Card key={destination.name}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                {destination.name === 'dropbox' ? (
                                                    <Cloud className="h-5 w-5 text-blue-600" />
                                                ) : (
                                                    <HardDrive className="h-5 w-5 text-gray-600" />
                                                )}
                                                <CardTitle className="text-lg">
                                                    {destination.name.charAt(0).toUpperCase() + destination.name.slice(1)}
                                                </CardTitle>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {getStatusIcon(destination.isReachable, hasBackups)}
                                                <Badge variant={getStatusColor(destination.isReachable, hasBackups)}>
                                                    {getStatusText(destination.isReachable, hasBackups)}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {destination.error && (
                                            <Alert variant="destructive" className="mb-4">
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertDescription>
                                                    <strong>Errore di connessione:</strong> {destination.error}
                                                    {destination.name === 'dropbox' && (
                                                        <div className="mt-2 text-xs">
                                                            Verifica che <code className="rounded bg-muted px-1 py-0.5">DROPBOX_REFRESH_TOKEN</code> sia configurato correttamente nel file <code className="rounded bg-muted px-1 py-0.5">.env</code>
                                                        </div>
                                                    )}
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                        {destination.isReachable ? (
                                            <div className="space-y-4">
                                                {/* Stats */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Backup</p>
                                                        <p className="text-lg font-semibold">{destination.totalBackups}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Spazio</p>
                                                        <p className="text-lg font-semibold">{formatBytes(destination.usedStorage)}</p>
                                                    </div>
                                                </div>

                                                {/* Dropbox Path */}
                                                {destination.name === 'dropbox' && destination.path_prefix && (
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Percorso su Dropbox</p>
                                                        <p className="break-all rounded bg-muted px-2 py-1 font-mono text-xs">
                                                            {destination.path_prefix}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Last Backup */}
                                                {destination.newestBackup && (
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Ultimo Backup</p>
                                                        <p className="text-sm">
                                                            {formatDate(destination.newestBackup.date)}
                                                            <span className="ml-2 text-muted-foreground">({destination.newestBackup.age})</span>
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Backup List */}
                                                {destination.backups.length > 0 ? (
                                                    <div>
                                                        <p className="mb-2 text-sm font-medium">Backup Recenti</p>
                                                        <div className="space-y-2">
                                                            {destination.backups.slice(0, 3).map((backup, index) => (
                                                                <div key={index} className="flex items-center justify-between rounded bg-muted p-2">
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium">{formatDate(backup.date)}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {backup.size} • {backup.age}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex space-x-1">
                                                                        {can.backup_download && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => downloadBackup(destination.disk, backup.path)}
                                                                            >
                                                                                <Download className="h-4 w-4" />
                                                                            </Button>
                                                                        )}
                                                                        {can.backup_delete && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => deleteBackup(destination.disk, backup.path)}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {destination.backups.length > 3 && (
                                                                <p className="text-center text-xs text-muted-foreground">
                                                                    +{destination.backups.length - 3} altri backup
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Empty className="border-0 py-8">
                                                        <EmptyContent>
                                                            <EmptyMedia variant="icon">
                                                                <File />
                                                            </EmptyMedia>
                                                            <EmptyTitle>Nessun backup trovato</EmptyTitle>
                                                            <EmptyDescription>
                                                                Non ci sono backup disponibili per questa destinazione.
                                                            </EmptyDescription>
                                                        </EmptyContent>
                                                    </Empty>
                                                )}
                                            </div>
                                        ) : (
                                            <Empty className="border-0 py-8">
                                                <EmptyContent>
                                                    <EmptyMedia variant="icon">
                                                        <XCircle className="text-red-500" />
                                                    </EmptyMedia>
                                                    <EmptyTitle className="text-red-600">Destinazione non raggiungibile</EmptyTitle>
                                                    {destination.error && <EmptyDescription>{destination.error}</EmptyDescription>}
                                                </EmptyContent>
                                            </Empty>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Clean Backups Confirmation Dialog */}
            <Dialog open={showCleanDialog} onOpenChange={setShowCleanDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Elimina Backup Vecchi
                        </DialogTitle>
                        <DialogDescription>Sei sicuro di voler eliminare i backup vecchi? Questa azione non può essere annullata.</DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowCleanDialog(false)}>
                            Annulla
                        </Button>
                        <Button variant="destructive" onClick={confirmCleanBackups}>
                            Elimina Backup Vecchi
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Single Backup Confirmation Dialog */}
            <DeleteConfirmationModal
                isOpen={isConfirmingDelete}
                onClose={handleCloseDeleteModal}
                onConfirm={executeDelete}
                title="Elimina Backup"
                description={
                    backupToDelete ? (
                        <>Sei sicuro di voler eliminare questo backup? Questa azione non può essere annullata.</>
                    ) : (
                        'Sei sicuro di voler eliminare questo backup? Questa azione non può essere annullata.'
                    )
                }
                confirmText="Elimina Backup"
            />

            {/* Backup Logs Dialog */}
            <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Log di Avanzamento Backup
                            {backupInProgress && (
                                <Badge variant="outline" className="ml-2">
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    In corso...
                                </Badge>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            Monitoraggio in tempo reale dell'avanzamento del backup
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        {backupLogs ? (
                            <div className="bg-slate-950 text-slate-50 rounded-lg p-4 font-mono text-sm max-h-[60vh] overflow-auto">
                                <pre className="whitespace-pre-wrap break-words">{backupLogs}</pre>
                            </div>
                        ) : (
                            <div className="bg-slate-100 rounded-lg p-4 text-center text-muted-foreground">
                                {backupInProgress ? 'In attesa dei log...' : 'Nessun log disponibile'}
                            </div>
                        )}
                    </div>
                    {backupPath && (
                        <div className="mt-4 rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                                    Backup salvato su Dropbox
                                </span>
                            </div>
                            <div className="text-sm text-green-600 dark:text-green-300">
                                <p className="font-mono break-all">{backupPath}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowLogsDialog(false);
                                if (!backupInProgress) {
                                    setBackupLogs('');
                                    setBackupLogKey(null);
                                    setBackupPath(null);
                                }
                            }}
                        >
                            {backupInProgress ? 'Nascondi (continua in background)' : 'Chiudi'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </PageLayout>
    );
}
