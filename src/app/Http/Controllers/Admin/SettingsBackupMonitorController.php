<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsBackupMonitorController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('BackupMonitor/Index', [
            'backupDestinations' => [],
            'backupStats' => [
                'totalBackups' => 0,
                'totalSize' => '0 B',
                'totalSizeInBytes' => 0,
                'newestBackup' => null,
                'oldestBackup' => null,
                'destinationsCount' => 0,
            ],
            'healthChecks' => [],
            'can' => [
                'backup_monitor_index' => true,
                'backup_run' => true,
                'backup_clean' => true,
                'backup_download' => true,
                'backup_delete' => true,
                'backup_status' => true,
            ],
        ]);
    }

    public function run(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Backup runner non configurato in questo ambiente.',
        ]);
    }

    public function clean(): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Clean non disponibile.']);
    }

    public function download(): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Download non disponibile.']);
    }

    public function delete(): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Delete non disponibile.']);
    }

    public function logs(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'lines' => '', 'log_key' => $request->query('log_key')]);
    }

    public function status(): JsonResponse
    {
        return response()->json(['success' => true, 'status' => 'idle']);
    }
}
