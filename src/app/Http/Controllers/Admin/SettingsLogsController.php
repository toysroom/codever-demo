<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class SettingsLogsController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) $request->query('per_page', 25);
        $perPage = max(5, min(100, $perPage));

        $query = Activity::query()->latest();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search): void {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('subject_type', 'like', "%{$search}%");
            });
        }

        /** @var LengthAwarePaginator<Activity> $paginator */
        $paginator = $query->paginate($perPage)->withQueryString();

        $storageLogFiles = $this->storageLogFiles();

        return Inertia::render('Logs/Index', [
            'logs' => [
                'data' => $paginator->getCollection()->map(fn (Activity $a) => [
                    'id' => $a->id,
                    'log_name' => $a->log_name,
                    'description' => $a->description,
                    'subject_type' => $a->subject_type,
                    'subject_id' => $a->subject_id,
                    'causer_type' => $a->causer_type,
                    'causer_id' => $a->causer_id,
                    'event' => $a->event,
                    'properties' => $a->properties,
                    'created_at' => $a->created_at?->toIso8601String(),
                    'updated_at' => $a->updated_at?->toIso8601String(),
                    'batch_uuid' => $a->batch_uuid,
                ])->values()->all(),
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'from' => $paginator->firstItem(),
                    'to' => $paginator->lastItem(),
                ],
            ],
            'filters' => [
                'search' => (string) $request->query('search', ''),
                'sort_field' => (string) $request->query('sort_field', 'created_at'),
                'sort_order' => (string) $request->query('sort_order', 'desc'),
                'log_filter' => (string) $request->query('log_filter', 'all'),
            ],
            'can' => [
                'log_index' => true,
                'log_destroy_all' => true,
            ],
            'storageLogFiles' => $storageLogFiles,
            'lang' => [
                'breadcrumb_dashboard' => 'Dashboard',
                'breadcrumb_logs' => 'Logs',
                'index_title' => 'Activity logs',
                'index_description' => 'Recent application activity.',
                'empty' => 'No activity yet.',
                'tab_activity_log' => 'Activity log',
                'storage_log_file_hint' => 'Tail of log file.',
                'storage_log_file_empty' => '(empty)',
                'filter_all' => 'All',
                'filter_with_event' => 'With event',
                'filter_user_accessed' => 'User accessed',
                'filter_label' => 'Filter',
                'delete_all_title' => 'Delete all logs?',
                'delete_all_description' => 'This removes all activity log rows.',
                'delete_all_confirm' => 'Delete all',
            ],
        ]);
    }

    public function destroyAll(): RedirectResponse
    {
        Activity::query()->delete();

        return redirect()->route('logs.index')->with('success', 'All activity logs deleted.');
    }

    /**
     * @return list<array{name: string, content: string}>
     */
    private function storageLogFiles(): array
    {
        $dir = storage_path('logs');
        if (! File::isDirectory($dir)) {
            return [];
        }

        $files = collect(File::files($dir))
            ->filter(fn (\SplFileInfo $f) => str_ends_with($f->getFilename(), '.log'))
            ->sortByDesc(fn (\SplFileInfo $f) => $f->getMTime())
            ->take(8)
            ->map(function (\SplFileInfo $f): array {
                $path = $f->getPathname();
                $raw = @file_get_contents($path) ?: '';
                $lines = preg_split("/\r\n|\n|\r/", $raw) ?: [];
                $tail = array_slice($lines, -500);

                return [
                    'name' => $f->getFilename(),
                    'content' => implode("\n", $tail),
                ];
            })
            ->values()
            ->all();

        return $files;
    }
}
