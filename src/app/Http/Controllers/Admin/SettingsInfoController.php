<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SettingsInfoController extends Controller
{
    public function index(): Response
    {
        $extensions = collect(get_loaded_extensions())
            ->mapWithKeys(fn (string $ext) => [$ext => true])
            ->all();

        $disabled = ini_get('disable_functions') ?: '';
        $disabledList = array_filter(array_map('trim', explode(',', $disabled)));

        $procOpenDisabled = in_array('proc_open', $disabledList, true);
        $procCloseDisabled = in_array('proc_close', $disabledList, true);

        $memoryLimit = (string) ini_get('memory_limit');

        return Inertia::render('Info/Index', [
            'phpInfo' => [
                'version' => PHP_VERSION,
                'sapi' => PHP_SAPI,
                'memory_limit' => $memoryLimit,
                'max_execution_time' => (string) ini_get('max_execution_time'),
                'upload_max_filesize' => (string) ini_get('upload_max_filesize'),
                'post_max_size' => (string) ini_get('post_max_size'),
                'timezone' => (string) date_default_timezone_get(),
                'proc_open_available' => function_exists('proc_open') && ! $procOpenDisabled,
                'proc_open_disabled' => $procOpenDisabled,
                'proc_close_available' => function_exists('proc_close') && ! $procCloseDisabled,
                'proc_close_disabled' => $procCloseDisabled,
                'disabled_functions' => $disabledList,
                'extensions' => $extensions,
            ],
            'serverInfo' => [
                'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'PHP built-in / unknown',
                'operating_system' => PHP_OS_FAMILY,
                'server_name' => $_SERVER['SERVER_NAME'] ?? gethostname() ?: 'localhost',
                'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? base_path(),
                'http_host' => $_SERVER['HTTP_HOST'] ?? 'localhost',
                'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'GET',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'server_port' => (string) ($_SERVER['SERVER_PORT'] ?? ''),
            ],
            'systemInfo' => [
                'hostname' => gethostname() ?: 'unknown',
                'load_average' => $this->loadAverage(),
                'memory_usage' => [
                    'current' => memory_get_usage(true),
                    'peak' => memory_get_peak_usage(true),
                    'limit' => $memoryLimit,
                    'current_formatted' => $this->formatBytes(memory_get_usage(true)),
                    'peak_formatted' => $this->formatBytes(memory_get_peak_usage(true)),
                ],
                'disk_space' => $this->diskSpace(),
            ],
            'dbInfo' => $this->databaseInfo(),
            'laravelInfo' => [
                'version' => app()->version(),
                'environment' => config('app.env'),
                'debug' => (bool) config('app.debug'),
                'url' => (string) config('app.url'),
                'timezone' => (string) config('app.timezone'),
                'locale' => (string) config('app.locale'),
                'cache_driver' => (string) config('cache.default'),
                'session_driver' => (string) config('session.driver'),
                'queue_driver' => (string) config('queue.default'),
            ],
        ]);
    }

    /**
     * @return array{0: float, 1: float, 2: float}
     */
    private function loadAverage(): array
    {
        if (function_exists('sys_getloadavg')) {
            $avg = sys_getloadavg();

            return [(float) $avg[0], (float) $avg[1], (float) $avg[2]];
        }

        return [0.0, 0.0, 0.0];
    }

    /**
     * @return array{total: int, free: int, used: int, total_formatted: string, free_formatted: string, used_formatted: string}
     */
    private function diskSpace(): array
    {
        $path = base_path();
        $total = @disk_total_space($path) ?: 0;
        $free = @disk_free_space($path) ?: 0;
        $used = max(0, $total - $free);

        return [
            'total' => (int) $total,
            'free' => (int) $free,
            'used' => (int) $used,
            'total_formatted' => $this->formatBytes((int) $total),
            'free_formatted' => $this->formatBytes((int) $free),
            'used_formatted' => $this->formatBytes((int) $used),
        ];
    }

    /**
     * @return array<string, string>
     */
    private function databaseInfo(): array
    {
        try {
            $v = DB::selectOne('select version() as v');

            return [
                'version' => is_object($v) && isset($v->v) ? (string) $v->v : 'unknown',
                'connection' => (string) config('database.default'),
                'charset' => (string) (config('database.connections.'.config('database.default').'.charset') ?? ''),
                'collation' => (string) (config('database.connections.'.config('database.default').'.collation') ?? ''),
                'driver' => (string) (config('database.connections.'.config('database.default').'.driver') ?? ''),
                'host' => (string) (config('database.connections.'.config('database.default').'.host') ?? ''),
                'port' => (string) (config('database.connections.'.config('database.default').'.port') ?? ''),
            ];
        } catch (\Throwable) {
            return [
                'version' => 'n/a',
                'connection' => (string) config('database.default'),
                'charset' => '',
                'collation' => '',
                'driver' => '',
                'host' => '',
                'port' => '',
            ];
        }
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = 0;
        $v = (float) $bytes;
        while ($v >= 1024 && $i < count($units) - 1) {
            $v /= 1024;
            $i++;
        }

        return number_format($v, 1).' '.$units[$i];
    }
}
