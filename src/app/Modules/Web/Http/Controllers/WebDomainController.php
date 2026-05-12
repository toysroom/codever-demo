<?php

namespace App\Modules\Web\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Member;
use App\Models\User;
use App\Models\WebDomain;
use App\Models\WebDomainDatabaseConnection;
use App\Models\WebDomainEmail;
use App\Models\WebDomainFtpAccount;
use App\Models\WebDomainFtpConnectionTestLog;
use App\Modules\Web\Contracts\WebDomainRepositoryInterface;
use App\Modules\Web\Http\Requests\StoreWebDomainRequest;
use App\Modules\Web\Http\Requests\UpdateWebDomainRequest;
use App\Modules\Web\Services\WebDomainFtpUploadService;
use App\Modules\Web\Services\WebDomainService;
use App\Modules\Web\Services\WebSiteProbeService;
use App\Modules\Web\Services\WebWordPressConnectorClient;
use App\Modules\Web\Services\WebWordPressVersionAuditService;
use App\Modules\Web\Support\WebDomainWordPressTabVisibility;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class WebDomainController extends Controller
{
    public function __construct(
        protected WebDomainRepositoryInterface $domains,
        protected WebDomainService $service,
        protected WebSiteProbeService $siteProbe,
        protected WebDomainFtpUploadService $ftpUpload,
        protected WebWordPressConnectorClient $wpConnectorClient,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', WebDomain::class);

        $allowedPerPage = [10, 15, 20, 25, 50, 100];
        $perPage = $this->inertiaTablePerPage($request, $allowedPerPage, 15);

        [$sf, $sd] = $this->inertiaTableSort($request, ['hostname', 'id', 'created_at', 'updated_at', 'stack'], 'hostname');

        $paginator = $this->domains->paginate($perPage, $sf, $sd)->withQueryString();
        $paginator->setCollection(
            $paginator->getCollection()->map(fn (WebDomain $d): array => $this->tableRowPayload($d)),
        );

        return Inertia::render('modules/web/domini/index', [
            'domains' => [
                'data' => $paginator->items(),
                'pagination' => $this->inertiaTablePaginationMeta($paginator),
            ],
            'filters' => [
                'sort_field' => $sf,
                'sort_order' => $sd,
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', WebDomain::class);

        [$memberIds, $memberOwners] = $this->memberOwnersAndIds();

        return Inertia::render('modules/web/domini/create', [
            'memberOwners' => $memberOwners,
            'customers' => $this->customerOptions($memberIds),
            'companies' => $this->companyOptions($memberIds),
        ]);
    }

    public function store(StoreWebDomainRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $ftpAccounts = $data['ftp_accounts'] ?? [];
        $emails = $data['emails'] ?? [];
        $databaseConnections = $data['database_connections'] ?? [];
        unset($data['ftp_accounts'], $data['emails'], $data['database_connections']);

        $this->service->create($request->user(), $data, $ftpAccounts, $emails, $databaseConnections);

        return redirect()
            ->route('modules.web.domini.index')
            ->with('success', __('Dominio registrato.'));
    }

    public function show(WebDomain $web_domain): Response
    {
        $this->authorize('view', $web_domain);

        $row = $this->domains->find($web_domain->id);
        if (! $row) {
            abort(404);
        }

        [$memberIds, $memberOwners] = $this->memberOwnersAndIds();

        return Inertia::render('modules/web/domini/show', [
            'domain' => $this->detailPayload($row, includeWordPressAuditPayload: true),
            'memberOwners' => $memberOwners,
            'customers' => $this->customerOptions($memberIds),
            'companies' => $this->companyOptions($memberIds),
        ]);
    }

    public function edit(WebDomain $web_domain): Response
    {
        $this->authorize('update', $web_domain);

        $row = $this->domains->find($web_domain->id);
        if (! $row) {
            abort(404);
        }

        [$memberIds, $memberOwners] = $this->memberOwnersAndIds();

        return Inertia::render('modules/web/domini/edit', [
            'domain' => $this->detailPayload($row, includeWordPressAuditPayload: true),
            'memberOwners' => $memberOwners,
            'customers' => $this->customerOptions($memberIds),
            'companies' => $this->companyOptions($memberIds),
        ]);
    }

    public function update(UpdateWebDomainRequest $request, WebDomain $web_domain): RedirectResponse
    {
        $data = $request->validated();
        $saveRedirect = $data['save_redirect'] ?? 'list';
        $ftpAccounts = array_key_exists('ftp_accounts', $data) ? $data['ftp_accounts'] : null;
        $emails = array_key_exists('emails', $data) ? $data['emails'] : null;
        $databaseConnections = array_key_exists('database_connections', $data) ? $data['database_connections'] : null;
        unset($data['ftp_accounts'], $data['emails'], $data['database_connections'], $data['save_redirect']);

        $this->service->update($request->user(), $web_domain, $data, $ftpAccounts, $emails, $databaseConnections);

        if ($saveRedirect === 'stay') {
            return redirect()->back()->with('success', __('Dominio aggiornato.'));
        }

        return redirect()
            ->route('modules.web.domini.index')
            ->with('success', __('Dominio aggiornato.'));
    }

    public function destroy(WebDomain $web_domain): RedirectResponse
    {
        $this->authorize('delete', $web_domain);

        $this->service->delete(request()->user(), $web_domain);

        return redirect()
            ->route('modules.web.domini.index')
            ->with('success', __('Dominio eliminato.'));
    }

    /**
     * Rileva raggiungibilità HTTP(S) del sito e indizi sullo stack tecnologico (euristico).
     * Persiste l’intero risultato in {@see WebDomain::$last_scan} e un riepilogo in {@see WebDomain::$stack}.
     */
    public function detect(Request $request, WebDomain $web_domain): JsonResponse
    {
        $this->authorize('update', $web_domain);

        $probe = $this->siteProbe->probe($web_domain->hostname);
        $hints = isset($probe['framework_hints']) && is_array($probe['framework_hints']) ? $probe['framework_hints'] : [];
        $stackSummary = $this->siteProbe->summarizeFrameworkStack($hints);
        $stackSummary = $stackSummary !== '' ? $stackSummary : null;

        $user = $request->user();

        $lastScan = [
            'scanned_at' => now()->toIso8601String(),
            'timezone' => config('app.timezone'),
            'source' => 'zelante_application',
            'trigger' => 'modules.web.domini.detect',
            'requested_by' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type' => $user->user_type,
            ] : null,
            'request' => [
                'ip' => $request->ip(),
                'forwarded_for' => $request->header('X-Forwarded-For'),
                'user_agent' => $request->userAgent(),
            ],
            'runtime' => [
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'app_env' => config('app.env'),
                'app_url' => config('app.url'),
            ],
            'probe' => $probe,
        ];

        $web_domain->update([
            'last_scan' => $lastScan,
            'stack' => $stackSummary,
        ]);

        return response()->json($probe);
    }

    /**
     * Carica un file di test in `wp-content/plugins/zelante-connector/` via FTP/SFTP (account predefinito o indicato).
     *
     * @return JsonResponse array{ok: bool, remote_path?: string, message?: string}
     */
    public function ftpUploadConnectorTest(Request $request, WebDomain $web_domain): JsonResponse
    {
        $this->authorize('update', $web_domain);

        $validated = $request->validate([
            'ftp_account_id' => [
                'nullable',
                'integer',
                Rule::exists('web_domain_ftp_accounts', 'id')->where('web_domain_id', $web_domain->id),
            ],
        ]);

        $account = isset($validated['ftp_account_id'])
            ? WebDomainFtpAccount::query()
                ->where('web_domain_id', $web_domain->id)
                ->whereKey((int) $validated['ftp_account_id'])
                ->firstOrFail()
            : $this->ftpUpload->resolveDefaultFtpAccount($web_domain);

        if (! $account instanceof WebDomainFtpAccount) {
            return response()->json([
                'ok' => false,
                'message' => __('Aggiungi almeno un account FTP nella scheda dominio (modifica).'),
            ], 422);
        }

        /** @var User|null $triggeredBy */
        $triggeredBy = $request->user();

        $success = false;
        $detailMessage = '';

        try {
            $result = $this->ftpUpload->uploadConnectorTestFile($web_domain, $account);
            $success = true;
            $detailMessage = isset($result['message']) ? (string) $result['message'] : '';

            return response()->json(array_merge($result, [
                'test_logged_at' => now()->toIso8601String(),
            ]));
        } catch (\Throwable $e) {
            report($e);
            $detailMessage = $e->getMessage();

            return response()->json([
                'ok' => false,
                'message' => $detailMessage,
                'test_logged_at' => now()->toIso8601String(),
            ], 422);
        } finally {
            $this->logWebDomainFtpConnectionTest(
                $web_domain,
                $account,
                WebDomainFtpConnectionTestLog::KIND_CONNECTOR_UPLOAD,
                $success,
                $detailMessage !== '' ? $detailMessage : null,
                $triggeredBy instanceof User ? $triggeredBy : null,
            );
        }
    }

    /**
     * Test round-trip FTP/SFTP per un account salvato: upload .txt in `wp-content/`, lettura, cancellazione se il contenuto coincide.
     *
     * Usa sempre le credenziali in DB; salva prima eventuali modifiche al form dominio.
     *
     * @return JsonResponse array{ok: bool, remote_path?: string, message?: string, preview?: string|null, preview_truncated?: bool}
     */
    public function ftpRoundtripTxtTest(Request $request, WebDomain $web_domain): JsonResponse
    {
        $this->authorize('update', $web_domain);

        $validated = $request->validate([
            'ftp_account_id' => [
                'required',
                'integer',
                Rule::exists('web_domain_ftp_accounts', 'id')->where('web_domain_id', $web_domain->id),
            ],
        ]);

        $account = WebDomainFtpAccount::query()
            ->where('web_domain_id', $web_domain->id)
            ->whereKey((int) $validated['ftp_account_id'])
            ->firstOrFail();

        /** @var User|null $triggeredBy */
        $triggeredBy = $request->user();

        $success = false;
        $detailMessage = '';

        try {
            $result = $this->ftpUpload->roundtripTxtTest($web_domain, $account);
            $success = true;
            $detailMessage = isset($result['message']) ? (string) $result['message'] : '';

            return response()->json(array_merge($result, [
                'test_logged_at' => now()->toIso8601String(),
            ]));
        } catch (\Throwable $e) {
            report($e);
            $detailMessage = $e->getMessage();

            return response()->json([
                'ok' => false,
                'message' => $detailMessage,
                'test_logged_at' => now()->toIso8601String(),
            ], 422);
        } finally {
            $this->logWebDomainFtpConnectionTest(
                $web_domain,
                $account,
                WebDomainFtpConnectionTestLog::KIND_ROUNDTRIP_TXT,
                $success,
                $detailMessage !== '' ? $detailMessage : null,
                $triggeredBy instanceof User ? $triggeredBy : null,
            );
        }
    }

    /**
     * Carica il plugin WordPress Zelante Connector e `zelante-secret.php` via FTP/SFTP.
     *
     * @return JsonResponse array{ok: bool, message?: string, plugin_path?: string, secret_path?: string, wp_connector_token_configured?: bool}
     */
    public function wpConnectorDeploy(Request $request, WebDomain $web_domain): JsonResponse
    {
        $this->authorize('update', $web_domain);

        $validated = $request->validate([
            'ftp_account_id' => [
                'nullable',
                'integer',
                Rule::exists('web_domain_ftp_accounts', 'id')->where('web_domain_id', $web_domain->id),
            ],
            'regenerate_token' => ['sometimes', 'boolean'],
        ]);

        $account = isset($validated['ftp_account_id'])
            ? WebDomainFtpAccount::query()
                ->where('web_domain_id', $web_domain->id)
                ->whereKey((int) $validated['ftp_account_id'])
                ->firstOrFail()
            : $this->ftpUpload->resolveDefaultFtpAccount($web_domain);

        if (! $account instanceof WebDomainFtpAccount) {
            return response()->json([
                'ok' => false,
                'message' => __('Aggiungi almeno un account FTP nella scheda dominio (modifica).'),
            ], 422);
        }

        $regenerate = (bool) ($validated['regenerate_token'] ?? false);

        if ($regenerate || ! $this->webDomainHasWpConnectorTokenConfigured($web_domain)) {
            $plainToken = Str::password(48);
            $web_domain->forceFill(['wp_connector_token' => $plainToken])->save();
        } else {
            $web_domain->refresh();
            $plainToken = (string) $web_domain->wp_connector_token;
            if ($plainToken === '') {
                $plainToken = Str::password(48);
                $web_domain->forceFill(['wp_connector_token' => $plainToken])->save();
            }
        }

        /** @var User|null $triggeredBy */
        $triggeredBy = $request->user();

        $success = false;
        $detailMessage = '';

        try {
            $paths = $this->ftpUpload->deployWordPressConnector($web_domain, $account, $plainToken);
            $success = true;
            $detailMessage = __('Plugin connettore caricato correttamente.');

            return response()->json([
                'ok' => true,
                'message' => $detailMessage,
                'plugin_path' => $paths['plugin_path'],
                'secret_path' => $paths['secret_path'],
                'wp_connector_token_configured' => true,
                'deploy_logged_at' => now()->toIso8601String(),
            ]);
        } catch (\Throwable $e) {
            report($e);
            $detailMessage = $e->getMessage();

            return response()->json([
                'ok' => false,
                'message' => $detailMessage,
                'wp_connector_token_configured' => $this->webDomainHasWpConnectorTokenConfigured($web_domain),
                'deploy_logged_at' => now()->toIso8601String(),
            ], 422);
        } finally {
            $this->logWebDomainFtpConnectionTest(
                $web_domain,
                $account,
                WebDomainFtpConnectionTestLog::KIND_CONNECTOR_DEPLOY,
                $success,
                $detailMessage !== '' ? $detailMessage : null,
                $triggeredBy instanceof User ? $triggeredBy : null,
            );
        }
    }

    /**
     * Legge `site-info` dal plugin WordPress via REST (token salvato sul dominio).
     */
    public function wpConnectorSiteInfo(WebDomain $web_domain): JsonResponse
    {
        $this->authorize('view', $web_domain);

        if (! $this->webDomainHasWpConnectorTokenConfigured($web_domain)) {
            return response()->json([
                'ok' => false,
                'message' => __('Configura il token eseguendo il deploy del connettore WordPress.'),
            ], 422);
        }

        $web_domain->refresh();
        $plainToken = (string) $web_domain->wp_connector_token;
        if ($plainToken === '') {
            return response()->json([
                'ok' => false,
                'message' => __('Token connettore non disponibile. Esegui di nuovo il deploy.'),
            ], 422);
        }

        $payload = $this->wpConnectorClient->fetchSiteInfo($web_domain->hostname, $plainToken);

        $ok = isset($payload['ok']) ? (bool) $payload['ok'] : false;
        $status = $ok ? 200 : 422;

        return response()->json($payload, $status);
    }

    /**
     * Verifica via HTTP se il plugin REST Zelante è presente e attivo (indice `/wp-json/`, senza token).
     */
    public function wpConnectorPluginCheck(WebDomain $web_domain): JsonResponse
    {
        $this->authorize('view', $web_domain);

        $payload = $this->wpConnectorClient->probeConnectorPluginActive($web_domain->hostname);
        $ok = isset($payload['ok']) && $payload['ok'] === true;
        $status = $ok ? 200 : 422;

        return response()->json($payload, $status);
    }

    /**
     * Aggiorna l’audit versioni WordPress (site-info + WordPress.org) e lo salva in {@see WebDomain::$wp_version_audit}.
     */
    public function wpConnectorVersionAudit(WebDomain $web_domain, WebWordPressVersionAuditService $auditService): JsonResponse
    {
        $this->authorize('update', $web_domain);

        try {
            $snapshot = $auditService->refreshAndPersist($web_domain);

            return response()->json([
                'ok' => true,
                'audit' => $snapshot,
            ]);
        } catch (ValidationException $e) {
            $first = collect($e->errors())->flatten()->first();

            return response()->json([
                'ok' => false,
                'message' => is_string($first) && $first !== '' ? $first : __('Validazione non riuscita.'),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'ok' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    protected function webDomainHasWpConnectorTokenConfigured(WebDomain $domain): bool
    {
        $raw = $domain->getAttributes()['wp_connector_token'] ?? null;

        return is_string($raw) && $raw !== '';
    }

    protected function logWebDomainFtpConnectionTest(
        WebDomain $domain,
        WebDomainFtpAccount $account,
        string $kind,
        bool $success,
        ?string $message,
        ?User $triggeredBy,
    ): void {
        try {
            WebDomainFtpConnectionTestLog::query()->create([
                'web_domain_id' => $domain->id,
                'web_domain_ftp_account_id' => $account->id,
                'kind' => $kind,
                'success' => $success,
                'message' => $message !== null && $message !== '' ? mb_substr($message, 0, 5000) : null,
                'triggered_by_user_id' => $triggeredBy?->id,
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * @return array<int, array{id: int, label: string, member_id: int}>
     */
    protected function customerOptions(array $memberIds): array
    {
        if ($memberIds === []) {
            return [];
        }

        return Customer::query()
            ->whereIn('member_id', $memberIds)
            ->orderBy('company_name')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->orderBy('id')
            ->get(['id', 'member_id', 'company_name', 'first_name', 'last_name'])
            ->map(fn (Customer $c): array => [
                'id' => $c->id,
                'member_id' => $c->member_id,
                'label' => $c->fullName(),
            ])
            ->all();
    }

    /**
     * @return array<int, array{id: int, label: string, member_id: int}>
     */
    protected function companyOptions(array $memberIds): array
    {
        if ($memberIds === []) {
            return [];
        }

        return Company::query()
            ->whereIn('member_id', $memberIds)
            ->orderBy('name')
            ->orderBy('id')
            ->get(['id', 'member_id', 'name'])
            ->map(fn (Company $c): array => [
                'id' => $c->id,
                'member_id' => $c->member_id,
                'label' => (string) $c->name,
            ])
            ->all();
    }

    /**
     * @return array{0: array<int, int>, 1: array<int, array{id: int, label: string}>}
     */
    protected function memberOwnersAndIds(): array
    {
        $memberOwners = Member::query()
            ->when(! request()->user()?->isAdmin(), fn ($q) => $q->whereKey(request()->user()?->getOwnerMember()?->id))
            ->owners()
            ->orderBy('company_name')
            ->orderBy('id')
            ->get(['id', 'company_name', 'first_name', 'last_name'])
            ->map(fn (Member $m): array => [
                'id' => $m->id,
                'label' => $m->company_name ?: trim(($m->first_name ?? '').' '.($m->last_name ?? '')) ?: ('#'.$m->id),
            ])
            ->all();

        return [
            array_map(static fn (array $o): int => $o['id'], $memberOwners),
            $memberOwners,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function detailPayload(WebDomain $d, bool $includeWordPressAuditPayload = false): array
    {
        $member = $d->member;
        $customer = $d->customer;
        $company = $d->company;

        $payload = [
            'id' => $d->id,
            'member_id' => $d->member_id,
            'member_label' => $member
                ? (string) ($member->company_name ?: trim(($member->first_name ?? '').' '.($member->last_name ?? '')) ?: ('#'.$member->id))
                : '',
            'customer_id' => $d->customer_id,
            'customer_label' => $customer ? $customer->fullName() : '',
            'company_id' => $d->company_id,
            'company_label' => $company ? (string) $company->name : '',
            'hostname' => $d->hostname,
            'notes' => $d->notes,
            'stack' => $d->stack,
            'last_scanned_at' => is_array($d->last_scan) ? ($d->last_scan['scanned_at'] ?? null) : null,
            'ftp_accounts' => $d->relationLoaded('ftpAccounts')
                ? $d->ftpAccounts->map(fn (WebDomainFtpAccount $a): array => $this->ftpAccountPayload($a))->values()->all()
                : [],
            'emails' => $d->relationLoaded('emails')
                ? $d->emails->map(fn (WebDomainEmail $e): array => $this->emailPayload($e))->values()->all()
                : [],
            'database_connections' => $d->relationLoaded('databaseConnections')
                ? $d->databaseConnections->map(fn (WebDomainDatabaseConnection $c): array => $this->databaseConnectionPayload($c))->values()->all()
                : [],
            'has_ftp_accounts' => $d->relationLoaded('ftpAccounts') && $d->ftpAccounts->isNotEmpty(),
            'wp_connector_token_configured' => $this->webDomainHasWpConnectorTokenConfigured($d),
            'wordpress_tab_visible' => WebDomainWordPressTabVisibility::isVisible($d),
        ];

        if ($includeWordPressAuditPayload) {
            $payload['wp_version_audit'] = is_array($d->wp_version_audit) ? $d->wp_version_audit : null;
        }

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    protected function ftpAccountPayload(WebDomainFtpAccount $a): array
    {
        $latest = $a->relationLoaded('latestFtpConnectionTestLog') ? $a->latestFtpConnectionTestLog : null;

        return [
            'id' => $a->id,
            'label' => $a->label,
            'protocol' => $a->protocol,
            'host' => $a->host,
            'port' => $a->port,
            'username' => $a->username,
            'has_password' => filled($a->getRawOriginal('password')),
            'remote_base_path' => $a->remote_base_path,
            'is_default' => $a->is_default,
            'notes' => $a->notes,
            'last_connection_test' => $latest
                ? [
                    'success' => $latest->success,
                    'kind' => $latest->kind,
                    'tested_at' => $latest->created_at?->toIso8601String(),
                    'message_preview' => filled($latest->message) ? Str::limit((string) $latest->message, 400) : null,
                ]
                : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function emailPayload(WebDomainEmail $e): array
    {
        return [
            'id' => $e->id,
            'label' => $e->label,
            'email' => $e->email,
            'purpose' => $e->purpose,
            'notes' => $e->notes,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function databaseConnectionPayload(WebDomainDatabaseConnection $c): array
    {
        return [
            'id' => $c->id,
            'label' => $c->label,
            'driver' => $c->driver,
            'host' => $c->host,
            'port' => $c->port,
            'database_name' => $c->database_name,
            'username' => $c->username,
            'has_password' => filled($c->getRawOriginal('password')),
            'charset' => $c->charset,
            'is_default' => $c->is_default,
            'notes' => $c->notes,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function tableRowPayload(WebDomain $d): array
    {
        return array_merge($this->detailPayload($d), [
            'created_at' => $d->created_at?->toIso8601String(),
            'updated_at' => $d->updated_at?->toIso8601String(),
            'member' => $d->relationLoaded('member') && $d->member ? [
                'id' => $d->member->id,
                'company_name' => $d->member->company_name,
                'first_name' => $d->member->first_name,
                'last_name' => $d->member->last_name,
            ] : null,
        ]);
    }
}
