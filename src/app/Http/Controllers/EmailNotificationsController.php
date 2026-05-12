<?php

namespace App\Http\Controllers;

use App\Models\DeletionCommunicationLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailNotificationsController extends Controller
{
    public function index(Request $request): Response
    {
        $allowedPerPage = [10, 15, 20, 25, 50];
        $perPage = $this->inertiaTablePerPage($request, $allowedPerPage, 20);

        [$sortField, $sortOrder] = $this->inertiaTableSort($request, [
            'id',
            'created_at',
            'subject_label',
            'email_sent_at',
            'notification_sent_at',
        ], 'created_at', 'desc');

        $paginator = DeletionCommunicationLog::query()
            ->where('caused_by_user_id', $request->user()->id)
            ->orderBy($sortField, $sortOrder)
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        $paginator->setCollection(
            $paginator->getCollection()->map(static fn (DeletionCommunicationLog $row): array => [
                'id' => $row->id,
                'subject_label' => $row->subject_label,
                'subject_type' => class_basename((string) $row->subject_type),
                'email_sent_at' => $row->email_sent_at?->toIso8601String(),
                'notification_sent_at' => $row->notification_sent_at?->toIso8601String(),
                'recipient_email' => $row->recipient_email,
                'created_at' => $row->created_at?->toIso8601String(),
            ]),
        );

        return Inertia::render('EmailNotifications/Index', [
            'logs' => [
                'data' => $paginator->items(),
                'pagination' => $this->inertiaTablePaginationMeta($paginator),
            ],
            'filters' => [
                'sort_field' => $sortField,
                'sort_order' => $sortOrder,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function destroyAllLogs(Request $request): RedirectResponse
    {
        $deleted = DeletionCommunicationLog::query()
            ->where('caused_by_user_id', $request->user()->id)
            ->delete();

        return redirect()
            ->route('email-notifications.index')
            ->with('success', __('ui.email_notifications_page.flash_logs_cleared', ['count' => $deleted]));
    }
}
