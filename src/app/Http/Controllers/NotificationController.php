<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $highlightId = $request->query('notification');
        $highlightId = is_string($highlightId) && Str::isUuid($highlightId)
            ? $highlightId
            : null;

        if ($highlightId !== null) {
            $row = $user->notifications()->whereKey($highlightId)->first();
            if ($row) {
                $highlightId = (string) $row->getKey();
                if ($row->unread()) {
                    $row->markAsRead();
                }
            } else {
                $highlightId = null;
            }
        }

        $allowedPerPage = [15, 20, 25, 50];
        $perPage = (int) $request->query('per_page', 20);
        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = 20;
        }

        $paginator = $user->notifications()->latest()->paginate($perPage)->withQueryString();

        $paginator->setCollection(
            $paginator->getCollection()->map(static function (DatabaseNotification $n): array {
                $data = $n->data;
                if (! is_array($data)) {
                    $data = json_decode((string) $n->data, true) ?: [];
                }

                return [
                    'id' => (string) $n->id,
                    'type' => class_basename((string) $n->type),
                    'data' => $data,
                    'read_at' => $n->read_at?->toIso8601String(),
                    'created_at' => $n->created_at->toIso8601String(),
                ];
            })
        );

        return Inertia::render('Notifications/Index', [
            'inbox' => [
                'data' => $paginator->items(),
                'pagination' => $this->inertiaTablePaginationMeta($paginator),
            ],
            'filters' => [
                'per_page' => $perPage,
            ],
            'highlight_notification_id' => $highlightId,
        ]);
    }

    public function markRead(Request $request, string $notification): RedirectResponse
    {
        $row = $request->user()->notifications()->whereKey($notification)->firstOrFail();
        $row->markAsRead();

        return back();
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return back();
    }

    public function destroyAll(Request $request): RedirectResponse
    {
        $deleted = $request->user()->notifications()->delete();

        return redirect()
            ->route('notifications.index')
            ->with('success', __('ui.notifications_inbox_page.flash_inbox_cleared', ['count' => $deleted]));
    }
}
