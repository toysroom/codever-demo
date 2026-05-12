<?php

namespace App\Http\Middleware;

use App\Models\Preference;
use App\Models\User;
use App\Services\ModuleEntitlementService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
                'can' => [
                    'preference_edit' => ($u = $request->user()) && ($u->isPlatformAdmin() || $u->can('settings.preferences.index')),
                ],
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'currentLocale' => app()->getLocale(),
            'ui' => [
                'nav' => [
                    'menu' => __('ui.nav.menu'),
                    'settings' => __('ui.nav.settings'),
                    'account_modules' => __('ui.nav.account_modules'),
                    'anagrafiche' => __('ui.nav.anagrafiche'),
                    'web' => __('ui.nav.web'),
                ],
                'notifications_bell' => [
                    'title' => __('ui.notifications_bell.title'),
                    'mark_all_read' => __('ui.notifications_bell.mark_all_read'),
                    'empty_unread' => __('ui.notifications_bell.empty_unread'),
                ],
                'email_notifications_page' => [
                    'title' => __('ui.email_notifications_page.title'),
                    'description' => __('ui.email_notifications_page.description'),
                    'col_record' => __('ui.email_notifications_page.col_record'),
                    'col_type' => __('ui.email_notifications_page.col_type'),
                    'col_email_sent' => __('ui.email_notifications_page.col_email_sent'),
                    'col_notification_sent' => __('ui.email_notifications_page.col_notification_sent'),
                    'col_recipient' => __('ui.email_notifications_page.col_recipient'),
                    'col_created' => __('ui.email_notifications_page.col_created'),
                    'empty' => __('ui.email_notifications_page.empty'),
                ],
                'email_notifications_tabs' => [
                    'aria' => __('ui.email_notifications_tabs.aria'),
                    'log' => __('ui.email_notifications_tabs.log'),
                    'inbox' => __('ui.email_notifications_tabs.inbox'),
                    'clear_all_logs_button' => __('ui.email_notifications_tabs.clear_all_logs_button'),
                    'clear_all_logs_button_short' => __('ui.email_notifications_tabs.clear_all_logs_button_short'),
                    'clear_all_logs_title' => __('ui.email_notifications_tabs.clear_all_logs_title'),
                    'clear_all_logs_description' => __('ui.email_notifications_tabs.clear_all_logs_description'),
                    'clear_all_inbox_button' => __('ui.email_notifications_tabs.clear_all_inbox_button'),
                    'clear_all_inbox_button_short' => __('ui.email_notifications_tabs.clear_all_inbox_button_short'),
                    'clear_all_inbox_title' => __('ui.email_notifications_tabs.clear_all_inbox_title'),
                    'clear_all_inbox_description' => __('ui.email_notifications_tabs.clear_all_inbox_description'),
                    'clear_all_confirm' => __('ui.email_notifications_tabs.clear_all_confirm'),
                    'clear_all_cancel' => __('ui.email_notifications_tabs.clear_all_cancel'),
                ],
                'notifications_inbox_page' => [
                    'title' => __('ui.notifications_inbox_page.title'),
                    'description' => __('ui.notifications_inbox_page.description'),
                    'empty' => __('ui.notifications_inbox_page.empty'),
                    'read_label' => __('ui.notifications_inbox_page.read_label'),
                    'unread_label' => __('ui.notifications_inbox_page.unread_label'),
                    'open_related' => __('ui.notifications_inbox_page.open_related'),
                    'page_label' => __('ui.notifications_inbox_page.page_label'),
                    'per_page_label' => __('ui.notifications_inbox_page.per_page_label'),
                ],
                'products_module' => [
                    'didactic_title' => __('ui.products_module.didactic_title'),
                    'from_redis' => __('ui.products_module.from_redis'),
                    'from_database' => __('ui.products_module.from_database'),
                    'strategy_hint' => __('ui.products_module.strategy_hint'),
                ],
            ],
            'availableLocales' => [
                'it' => 'Italiano',
                'en' => 'English',
            ],
            'sidebarNavItems' => $this->sidebarNavItems($request),
            'anagraficheNavItems' => $this->anagraficheNavItems($request),
            'webNavItems' => $this->webNavItems($request),
            'accountModulesNavItems' => $this->accountModulesNavItems($request),
            'settingsNavItems' => $this->settingsNavItems($request),
            'sidebarPreferences' => $this->sidebarPreferences(),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
            ],
            'notifications' => $this->notificationsSummary($request->user()),
        ];
    }

    /**
     * @return array{unread_count: int, items: list<array{id: string, read_at: string|null, created_at: string, data: array<string, mixed>}>}
     */
    protected function notificationsSummary(?\Illuminate\Contracts\Auth\Authenticatable $user): array
    {
        if (! $user instanceof User) {
            return ['unread_count' => 0, 'items' => []];
        }

        $unreadCount = $user->unreadNotifications()->count();
        $items = $user->unreadNotifications()
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn ($n) => [
                'id' => (string) $n->id,
                'read_at' => $n->read_at?->toIso8601String(),
                'created_at' => $n->created_at->toIso8601String(),
                'data' => is_array($n->data) ? $n->data : (json_decode((string) $n->data, true) ?: []),
            ])
            ->values()
            ->all();

        return [
            'unread_count' => $unreadCount,
            'items' => $items,
        ];
    }

    /**
     * @return list<array{title: string, href: string, icon?: string}>
     */
    protected function sidebarNavItems(Request $request): array
    {
        $user = $request->user();
        if (! $user) {
            return [];
        }

        $items = [];
        $modules = app(ModuleEntitlementService::class);

        if ($user->canAccess('dashboard', 'index')) {
            $items[] = [
                'title' => __('ui.sidebar.dashboard'),
                'href' => route('dashboard'),
                'icon' => 'layout-grid',
            ];
        }

        if ($user->can('email_notifications.index')) {
            $items[] = [
                'title' => __('ui.sidebar.email_notifications'),
                'href' => route('email-notifications.index'),
                'icon' => 'mail',
            ];
        }

        if ($user->isPlatformAdmin() || $user->isAdmin() || $user->can('settings.accounts.index')) {
            $items[] = [
                'title' => __('ui.sidebar.accounts'),
                'href' => route('accounts.index'),
                'icon' => 'building-2',
            ];
        }

        $owner = $user->getOwnerMember();
        $hasCustomers = $user->isAdmin() || ($owner && $modules->memberHasModule($owner, 'customers'));

        if ($hasCustomers && $user->canAccess('customers', 'index')) {
            $items[] = [
                'title' => __('ui.sidebar.customers'),
                'href' => route('modules.customers.index'),
                'icon' => 'users',
            ];
        }

        if ($hasCustomers && $user->canAccess('companies', 'index')) {
            $items[] = [
                'title' => __('ui.sidebar.companies'),
                'href' => route('modules.companies.index'),
                'icon' => 'landmark',
            ];
        }

        return $items;
    }

    /**
     * Master data in sidebar: tipi cliente, catalogo prodotti, piani licenza (permesso admin).
     *
     * @return list<array{title: string, href: string, icon?: string}>
     */
    protected function anagraficheNavItems(Request $request): array
    {
        $user = $request->user();
        if (! $user) {
            return [];
        }

        $modules = app(ModuleEntitlementService::class);
        $owner = $user->getOwnerMember();
        $hasProducts = $user->isAdmin() || ($owner && $modules->memberHasModule($owner, 'products'));
        $hasCustomers = $user->isAdmin() || ($owner && $modules->memberHasModule($owner, 'customers'));
        $fullAdmin = $user->isPlatformAdmin() || $user->isAdmin();
        $canLicensePlans = $fullAdmin || $user->can('settings.license_plans.index');

        if (! $hasProducts && ! $hasCustomers && ! $canLicensePlans) {
            return [];
        }

        $items = [];

        if ($hasCustomers && $user->canAccess('customer_types', 'index')) {
            $items[] = [
                'title' => __('ui.sidebar.customer_types'),
                'href' => route('modules.customers.customer-types.index'),
                'icon' => 'tags',
            ];
        }

        if ($hasProducts && $user->canAccess('product_categories', 'index')) {
            $items[] = [
                'title' => __('ui.sidebar.product_categories'),
                'href' => route('modules.products.categorie.index'),
                'icon' => 'folder-tree',
            ];
        }

        if ($hasProducts && $user->canAccess('price_lists', 'index')) {
            $items[] = [
                'title' => __('ui.sidebar.price_lists'),
                'href' => route('modules.products.listini.index'),
                'icon' => 'clipboard-list',
            ];
        }

        if ($hasProducts && $user->canAccess('products', 'index')) {
            $items[] = [
                'title' => __('ui.sidebar.products'),
                'href' => route('modules.products.prodotti.index'),
                'icon' => 'package',
            ];
        }

        if ($canLicensePlans) {
            $items[] = [
                'title' => __('ui.sidebar.license_plans'),
                'href' => route('license-plans.index'),
                'icon' => 'layers',
            ];
        }

        return $items;
    }

    /**
     * Module Web — domini registrati collegati a cliente e azienda.
     *
     * @return list<array{title: string, href: string, icon?: string}>
     */
    protected function webNavItems(Request $request): array
    {
        $user = $request->user();
        if (! $user) {
            return [];
        }

        $modules = app(ModuleEntitlementService::class);
        $owner = $user->getOwnerMember();
        $hasWeb = $user->isAdmin() || ($owner && $modules->memberHasModule($owner, 'web'));

        if (! $hasWeb) {
            return [];
        }

        $items = [];
        if ($user->canAccess('web_domains', 'index')) {
            $items[] = [
                'title' => __('ui.sidebar.web_domains'),
                'href' => route('modules.web.domini.index'),
                'icon' => 'globe',
            ];
        }
        if ($user->canAccess('web_hosting_providers', 'index')) {
            $items[] = [
                'title' => __('ui.sidebar.web_hosting_providers'),
                'href' => route('modules.web.hosting-providers.index'),
                'icon' => 'warehouse',
            ];
        }
        if ($user->canAccess('web_servers', 'index')) {
            $items[] = [
                'title' => __('ui.sidebar.web_servers'),
                'href' => route('modules.web.servers.index'),
                'icon' => 'server',
            ];
        }

        return $items;
    }

    /**
     * Sezione sidebar separata da Settings: assegnazione moduli agli account.
     *
     * @return list<array{title: string, href: string, icon: string}>
     */
    protected function accountModulesNavItems(Request $request): array
    {
        $user = $request->user();
        if (! $user) {
            return [];
        }

        if (! ($user->isPlatformAdmin() || $user->isAdmin() || $user->can('settings.modules.index'))) {
            return [];
        }

        return [
            [
                'title' => __('ui.sidebar.account_module_link'),
                'href' => route('settings.modules.index'),
                'icon' => 'package',
            ],
        ];
    }

    /**
     * Voci sotto "Settings": admin piattaforma (user_type), ruolo Spatie admin, oppure permesso singolo.
     *
     * @return list<array{title: string, href: string, icon: string}>
     */
    protected function settingsNavItems(Request $request): array
    {
        $user = $request->user();
        if (! $user) {
            return [];
        }

        $definitions = [
            ['title' => __('ui.sidebar.users'), 'href' => route('users.index'), 'permission' => 'settings.users.index', 'icon' => 'user'],
            ['title' => __('ui.sidebar.roles'), 'href' => route('roles.index'), 'permission' => 'settings.roles.index', 'icon' => 'user-plus'],
            ['title' => __('ui.sidebar.permissions'), 'href' => route('permissions.index'), 'permission' => 'settings.permissions.index', 'icon' => 'shield'],
            ['title' => __('ui.sidebar.preferences'), 'href' => route('preferences.index'), 'permission' => 'settings.preferences.index', 'icon' => 'sliders-horizontal'],
            ['title' => __('ui.sidebar.logs'), 'href' => route('logs.index'), 'permission' => 'settings.logs.index', 'icon' => 'file-text'],
            ['title' => __('ui.sidebar.system_info'), 'href' => route('info.index'), 'permission' => 'settings.system.index', 'icon' => 'info'],
            ['title' => __('ui.sidebar.backup_monitor'), 'href' => route('backup-monitor.index'), 'permission' => 'settings.backup.index', 'icon' => 'database'],
        ];

        $fullSettingsAccess = $user->isPlatformAdmin() || $user->isAdmin();

        $items = [];
        foreach ($definitions as $row) {
            if ($fullSettingsAccess || $user->can($row['permission'])) {
                $items[] = [
                    'title' => $row['title'],
                    'href' => $row['href'],
                    'icon' => $row['icon'],
                ];
            }
        }

        return $items;
    }

    /**
     * @return array{timezone: string, timezone_preference_id: int|null}
     */
    protected function sidebarPreferences(): array
    {
        $row = Preference::query()->where('code', 'system_timezone')->first();

        return [
            'timezone' => (string) ($row?->value ?: config('app.timezone', 'UTC')),
            'timezone_preference_id' => $row?->id,
        ];
    }
}
