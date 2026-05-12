<?php

namespace App\Modules\Web\Services;

use App\Models\WebDomain;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class WebWordPressVersionAuditService
{
    public function __construct(
        protected WebWordPressConnectorClient $connectorClient,
    ) {}

    /**
     * Legge site-info dal sito, confronta con WordPress.org, salva JSON su {@see WebDomain::$wp_version_audit}.
     *
     * @return array<string, mixed>
     */
    public function refreshAndPersist(WebDomain $domain): array
    {
        $domain->refresh();
        $plain = trim((string) $domain->wp_connector_token);
        if ($plain === '') {
            throw ValidationException::withMessages([
                'wp_connector' => [__('Configura il token con il deploy del connettore prima di aggiornare l’audit WordPress.')],
            ]);
        }

        $siteInfo = $this->connectorClient->fetchSiteInfo($domain->hostname, $plain);
        $siteOk = isset($siteInfo['ok']) && $siteInfo['ok'] === true;
        if (! $siteOk) {
            $msg = is_string($siteInfo['message'] ?? null) ? (string) $siteInfo['message'] : __('Risposta site-info non valida.');

            throw ValidationException::withMessages([
                'site_info' => [$msg],
            ]);
        }

        try {
            /** @var array<string, mixed> $normalizedSiteInfo */
            $normalizedSiteInfo = json_decode(json_encode($siteInfo, JSON_THROW_ON_ERROR), true, 512, JSON_THROW_ON_ERROR);
            $siteInfo = is_array($normalizedSiteInfo) ? $normalizedSiteInfo : $siteInfo;
        } catch (\JsonException) {
            // mantiene $siteInfo originale
        }

        $errors = [];
        $groups = [];

        $wpVersion = (string) ($siteInfo['wp_version'] ?? '');
        $latestCore = $this->fetchLatestWordPressVersion($wpVersion, $errors);
        $latestCoreRepoAt = $this->fetchCoreZipLastModifiedIso($latestCore);
        $groups[] = [
            'id' => 'core',
            'label' => 'WordPress (core)',
            'rows' => [
                [
                    'name' => 'WordPress',
                    'slug' => 'wordpress',
                    'current_version' => $wpVersion !== '' ? $wpVersion : '—',
                    'latest_version' => $latestCore,
                    'latest_repo_updated_at' => $latestCoreRepoAt,
                    'notes' => null,
                    'version_status' => $this->versionUpgradeStatus($wpVersion, $latestCore),
                ],
            ],
        ];

        $themeRows = $this->buildThemeAuditRows($siteInfo, $errors);
        if ($themeRows !== []) {
            $groups[] = [
                'id' => 'themes',
                'label' => __('Temi'),
                'rows' => $themeRows,
            ];
        }

        $rows = $this->buildPluginAuditRows($siteInfo, $errors);

        $groups[] = [
            'id' => 'plugins',
            'label' => 'Plugin',
            'rows' => $rows,
        ];

        $phpVer = (string) ($siteInfo['php_version'] ?? '');
        $latestPhp = $this->fetchLatestPhpStableVersion($phpVer, $errors);
        $groups[] = [
            'id' => 'runtime',
            'label' => 'Runtime',
            'rows' => [
                [
                    'name' => 'PHP',
                    'slug' => 'php',
                    'current_version' => $phpVer !== '' ? $phpVer : '—',
                    'latest_version' => $latestPhp,
                    'latest_repo_updated_at' => null,
                    'notes' => $latestPhp === null
                        ? __('Impossibile determinare l’ultima versione PHP stabile (rete o API endoflife.date).')
                        : __('Confronto con l’ultima release stabile indicata da endoflife.date (riferimento generico).'),
                    'version_status' => $this->versionUpgradeStatus($phpVer, $latestPhp),
                ],
            ],
        ];

        $snapshot = [
            'generated_at' => now()->toIso8601String(),
            'source_site_info' => $siteInfo,
            'groups' => $groups,
            'errors' => $errors,
        ];

        $domain->update(['wp_version_audit' => $snapshot]);

        return $snapshot;
    }

    /**
     * @param  array<int, string>  $errors
     */
    protected function fetchLatestWordPressVersion(string $installedVersion, array &$errors): ?string
    {
        try {
            $response = Http::timeout(20)
                ->asForm()
                ->post('https://api.wordpress.org/core/version-check/1.7/', [
                    'version' => $installedVersion !== '' ? $installedVersion : '0.0',
                    'php' => PHP_VERSION,
                    'locale' => 'it_IT',
                ]);
        } catch (\Throwable $e) {
            $errors[] = __('Controllo versione core: :msg', ['msg' => Str::limit($e->getMessage(), 120)]);

            return null;
        }

        if (! $response->successful()) {
            $errors[] = __('API core WordPress.org non disponibile (HTTP :code).', ['code' => $response->status()]);

            return null;
        }

        $json = $response->json();
        if (! is_array($json)) {
            return null;
        }

        $offers = $json['offers'] ?? null;
        if (is_array($offers) && $offers !== []) {
            $first = $offers[0];
            if (is_array($first) && isset($first['version'])) {
                return (string) $first['version'];
            }
        }

        return $installedVersion !== '' ? $installedVersion : null;
    }

    /**
     * Data di pubblicazione del pacchetto core su downloads.wordpress.org (header Last-Modified dello zip).
     */
    protected function fetchCoreZipLastModifiedIso(?string $version): ?string
    {
        $safe = $this->sanitizeWordPressCoreZipVersionToken($version);
        if ($safe === null) {
            return null;
        }

        try {
            $url = 'https://downloads.wordpress.org/release/wordpress-'.$safe.'.zip';
            $response = Http::timeout(12)->head($url);
        } catch (\Throwable) {
            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        $lm = $response->header('Last-Modified');
        if (! is_string($lm) || trim($lm) === '') {
            return null;
        }

        return $this->parseWordPressOrgDateToIso8601($lm);
    }

    protected function sanitizeWordPressCoreZipVersionToken(?string $version): ?string
    {
        if ($version === null) {
            return null;
        }
        $v = trim((string) $version);
        if ($v === '' || ! preg_match('/^\d+\.\d+(?:\.\d+)?$/', $v)) {
            return null;
        }

        return $v;
    }

    /**
     * @return array{version: string, latest_repo_updated_at: ?string}|null
     */
    protected function fetchPluginDirectoryInfo(string $slug): ?array
    {
        $slug = strtolower(trim($slug));
        if ($slug === '' || ! preg_match('/^[a-z0-9_-]+$/', $slug)) {
            return null;
        }

        try {
            $url = 'https://api.wordpress.org/plugins/info/1.0/'.$slug.'.json';
            $response = Http::timeout(12)->acceptJson()->get($url);
        } catch (\Throwable) {
            return null;
        }

        if ($response->status() === 404) {
            return null;
        }
        if (! $response->successful()) {
            return null;
        }

        $json = $response->json();
        if (! is_array($json)) {
            return null;
        }

        if (! isset($json['version'])) {
            return null;
        }

        $rawDate = $json['last_updated'] ?? null;
        $iso = is_string($rawDate) && trim($rawDate) !== ''
            ? $this->parseWordPressOrgDateToIso8601($rawDate)
            : null;

        return [
            'version' => (string) $json['version'],
            'latest_repo_updated_at' => $iso,
        ];
    }

    /**
     * Directory temi (API 1.2); include versione e ultimo aggiornamento elenco.
     *
     * @return array{version: string, latest_repo_updated_at: ?string}|null
     */
    protected function fetchThemeDirectoryInfo(string $stylesheet): ?array
    {
        $stylesheet = trim($stylesheet);
        if ($stylesheet === '') {
            return null;
        }

        try {
            $response = Http::timeout(12)->acceptJson()->get('https://api.wordpress.org/themes/info/1.2/', [
                'action' => 'theme_information',
                'request' => [
                    'slug' => $stylesheet,
                ],
            ]);
        } catch (\Throwable) {
            return null;
        }

        if ($response->status() === 404) {
            return null;
        }
        if (! $response->successful()) {
            return null;
        }

        $json = $response->json();
        if (! is_array($json)) {
            return null;
        }

        if (! isset($json['version'])) {
            return null;
        }

        $raw = $json['last_updated_time'] ?? $json['last_updated'] ?? null;
        $iso = is_string($raw) && trim($raw) !== ''
            ? $this->parseWordPressOrgDateToIso8601($raw)
            : null;

        return [
            'version' => (string) $json['version'],
            'latest_repo_updated_at' => $iso,
        ];
    }

    protected function parseWordPressOrgDateToIso8601(string $raw): ?string
    {
        $raw = trim($raw);
        if ($raw === '') {
            return null;
        }

        try {
            return Carbon::parse($raw)->utc()->toIso8601String();
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * @param  array<string, mixed>  $siteInfo
     * @param  array<int, string>  $errors
     * @return array<int, array{name: string, slug: string, current_version: string, latest_version: ?string, latest_repo_updated_at: ?string, active: bool, notes: ?string, version_status: string}>
     */
    protected function buildThemeAuditRows(array $siteInfo, array &$errors): array
    {
        $themes = $siteInfo['themes'] ?? null;
        if ((! is_array($themes) || $themes === []) && isset($siteInfo['data']) && is_array($siteInfo['data']['themes'] ?? null)) {
            $themes = $siteInfo['data']['themes'];
        }

        if (is_array($themes) && $themes !== [] && $this->isListOfThemeRows($themes)) {
            $rows = [];
            $count = 0;
            foreach ($themes as $t) {
                if (! is_array($t)) {
                    continue;
                }
                $count++;
                if ($count > 80) {
                    $errors[] = __('Elenco temi troncato a 80 voci per limite prestazioni.');
                    break;
                }
                $slug = (string) ($t['slug'] ?? $t['stylesheet'] ?? '');
                $name = (string) ($t['name'] ?? $slug);
                $ver = (string) ($t['version'] ?? '');
                $active = (bool) ($t['active'] ?? false);
                $dir = $slug !== '' ? $this->fetchThemeDirectoryInfo($slug) : null;
                $latest = is_array($dir) ? ($dir['version'] ?? null) : null;
                $latestRepoAt = is_array($dir) ? ($dir['latest_repo_updated_at'] ?? null) : null;
                $notes = null;
                if ($latest === null && $slug !== '') {
                    $notes = __('Tema assente da WordPress.org (non in directory, bundle proprietario o errore di rete).');
                }
                $rows[] = [
                    'name' => $name !== '' ? $name : ($slug !== '' ? $slug : '—'),
                    'slug' => $slug !== '' ? $slug : '—',
                    'current_version' => $ver !== '' ? $ver : '—',
                    'latest_version' => $latest,
                    'latest_repo_updated_at' => $latestRepoAt,
                    'active' => $active,
                    'notes' => $notes,
                    'version_status' => $this->pluginRowVersionStatus($active, $ver, $latest),
                ];
            }

            return $rows;
        }

        if (is_array($themes) && $themes !== [] && ! $this->isListOfThemeRows($themes)) {
            $errors[] = __('Formato elenco temi dall’API non riconosciuto. Verifica la versione del connettore Zelante sul sito WordPress.');
        }

        if (! is_array($themes) || $themes === []) {
            $totalThemes = (int) ($siteInfo['themes_total_count'] ?? 0);
            if ($totalThemes > 0) {
                $errors[] = __('Il sito segnala :n temi ma l’elenco non è nell’API: aggiorna il plugin Zelante Connector sul server (≥ 1.1.2) e riesegui l’audit.', ['n' => $totalThemes]);
            }
        }

        $stylesheet = (string) ($siteInfo['active_theme_stylesheet'] ?? '');
        $themeName = (string) ($siteInfo['active_theme_name'] ?? $siteInfo['active_theme'] ?? '');
        $themeVersion = (string) ($siteInfo['active_theme_version'] ?? '');
        if ($stylesheet === '' && $themeName === '') {
            return [];
        }

        $themeDir = $stylesheet !== '' ? $this->fetchThemeDirectoryInfo($stylesheet) : null;
        $latestTheme = is_array($themeDir) ? ($themeDir['version'] ?? null) : null;
        $latestThemeRepoAt = is_array($themeDir) ? ($themeDir['latest_repo_updated_at'] ?? null) : null;

        return [[
            'name' => $themeName !== '' ? $themeName : ($stylesheet !== '' ? $stylesheet : '—'),
            'slug' => $stylesheet !== '' ? $stylesheet : '—',
            'current_version' => $themeVersion !== '' ? $themeVersion : '—',
            'latest_version' => $latestTheme,
            'latest_repo_updated_at' => $latestThemeRepoAt,
            'active' => true,
            'notes' => $latestTheme === null && $stylesheet !== ''
                ? __('Tema non trovato su WordPress.org o errore di rete.')
                : null,
            'version_status' => $this->pluginRowVersionStatus(true, $themeVersion, $latestTheme),
        ]];
    }

    /**
     * @param  array<mixed>  $themes
     */
    protected function isListOfThemeRows(array $themes): bool
    {
        foreach ($themes as $row) {
            if (! is_array($row)) {
                return false;
            }
            $slug = (string) ($row['slug'] ?? $row['stylesheet'] ?? '');
            if ($slug === '') {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<string, mixed>  $siteInfo
     * @param  array<int, string>  $errors
     * @return array<int, array{name: string, slug: string, current_version: string, latest_version: ?string, latest_repo_updated_at: ?string, active: bool, notes: ?string, version_status: string}>
     */
    protected function buildPluginAuditRows(array $siteInfo, array &$errors): array
    {
        $plugins = $siteInfo['plugins'] ?? null;
        if ((! is_array($plugins) || $plugins === []) && isset($siteInfo['data']) && is_array($siteInfo['data']['plugins'] ?? null)) {
            $plugins = $siteInfo['data']['plugins'];
        }

        if (! is_array($plugins) || $plugins === []) {
            $total = (int) ($siteInfo['plugins_total_count'] ?? 0);
            if ($total > 0) {
                $errors[] = __('Il sito segnala :n plugin ma l’elenco non è nell’API: aggiorna il plugin Zelante Connector sul server (≥ 1.1.2) e riesegui l’audit.', ['n' => $total]);
            }

            return [];
        }

        if ($this->isAssociativePluginFileMap($plugins)) {
            $activeFiles = is_array($siteInfo['active_plugin_files'] ?? null)
                ? $siteInfo['active_plugin_files']
                : [];
            $list = [];
            foreach ($plugins as $file => $meta) {
                if (! is_string($file) || ! is_array($meta)) {
                    continue;
                }
                $slug = str_contains($file, '/') ? dirname($file) : pathinfo($file, PATHINFO_FILENAME);
                $slug = is_string($slug) ? $slug : '';
                $active = in_array($file, $activeFiles, true);
                $list[] = [
                    'file' => $file,
                    'slug' => $slug,
                    'name' => isset($meta['Name']) ? (string) $meta['Name'] : '',
                    'version' => isset($meta['Version']) ? (string) $meta['Version'] : '',
                    'active' => $active,
                ];
            }
            $plugins = $list;
        }

        if (! $this->isListOfPluginRows($plugins)) {
            $errors[] = __('Formato elenco plugin dall’API non riconosciuto. Verifica la versione del connettore Zelante sul sito WordPress.');

            return [];
        }

        usort($plugins, static function ($a, $b): int {
            $na = is_array($a) ? (string) ($a['name'] ?? '') : '';
            $nb = is_array($b) ? (string) ($b['name'] ?? '') : '';

            return strcasecmp($na, $nb);
        });

        $rows = [];
        $count = 0;
        foreach ($plugins as $p) {
            if (! is_array($p)) {
                continue;
            }
            $count++;
            if ($count > 80) {
                $errors[] = __('Elenco plugin troncato a 80 voci per limite prestazioni.');
                break;
            }
            $slug = (string) ($p['slug'] ?? '');
            $name = (string) ($p['name'] ?? $slug);
            $ver = (string) ($p['version'] ?? '');
            $active = (bool) ($p['active'] ?? false);
            $dir = $slug !== '' ? $this->fetchPluginDirectoryInfo($slug) : null;
            $latest = is_array($dir) ? ($dir['version'] ?? null) : null;
            $latestRepoAt = is_array($dir) ? ($dir['latest_repo_updated_at'] ?? null) : null;
            $notes = null;
            if ($latest === null && $slug !== '') {
                $notes = __('Plugin assente da WordPress.org (premium, custom o slug non riconosciuto).');
            }
            $rows[] = [
                'name' => $name,
                'slug' => $slug,
                'current_version' => $ver !== '' ? $ver : '—',
                'latest_version' => $latest,
                'latest_repo_updated_at' => $latestRepoAt,
                'active' => $active,
                'notes' => $notes,
                'version_status' => $this->pluginRowVersionStatus($active, $ver, $latest),
            ];
        }

        return $rows;
    }

    /**
     * Ultima patch della stessa serie (es. 8.2.x) da endoflife.date; se la serie non è in elenco, usa la release più alta nota.
     *
     * @param  array<int, string>  $errors
     */
    protected function fetchLatestPhpStableVersion(string $installedVersion, array &$errors): ?string
    {
        try {
            $response = Http::timeout(15)->acceptJson()->get('https://endoflife.date/api/php.json');
        } catch (\Throwable $e) {
            return null;
        }

        if (! $response->successful()) {
            $errors[] = __('API endoflife.date PHP non disponibile (HTTP :code).', ['code' => $response->status()]);

            return null;
        }

        $list = $response->json();
        if (! is_array($list)) {
            return null;
        }

        $branch = $this->phpBranchPrefix($installedVersion);
        foreach ($list as $entry) {
            if (! is_array($entry)) {
                continue;
            }
            $cycle = isset($entry['cycle']) ? trim((string) $entry['cycle']) : '';
            if ($branch !== null && $cycle !== '' && $cycle === $branch) {
                $latest = isset($entry['latest']) ? trim((string) $entry['latest']) : '';

                return $latest !== '' ? $latest : null;
            }
        }

        $best = null;
        foreach ($list as $entry) {
            if (! is_array($entry)) {
                continue;
            }
            $latest = isset($entry['latest']) ? trim((string) $entry['latest']) : '';
            if ($latest === '') {
                continue;
            }
            $san = $this->sanitizeVersionForCompare($latest);
            if ($san === '') {
                continue;
            }
            if ($best === null || version_compare($san, $this->sanitizeVersionForCompare($best), '>')) {
                $best = $latest;
            }
        }

        return $best;
    }

    protected function phpBranchPrefix(string $installed): ?string
    {
        if (preg_match('/^(\d+\.\d+)/', trim($installed), $m)) {
            return $m[1];
        }

        return null;
    }

    protected function sanitizeVersionForCompare(string $version): string
    {
        $v = trim(str_replace('—', '', $version));
        $v = trim(str_replace('‎', '', $v));
        if ($v === '') {
            return '';
        }
        if (str_starts_with(strtolower($v), 'v')) {
            $v = substr($v, 1);
        }

        return trim($v);
    }

    /**
     * @return 'current'|'outdated'|'unknown'
     */
    protected function versionUpgradeStatus(string $currentDisplay, ?string $latest): string
    {
        $c = $this->sanitizeVersionForCompare($currentDisplay);
        if ($c === '') {
            return 'unknown';
        }
        if ($latest === null || trim((string) $latest) === '') {
            return 'unknown';
        }
        $l = $this->sanitizeVersionForCompare((string) $latest);
        if ($l === '') {
            return 'unknown';
        }
        if (version_compare($c, $l, '>=')) {
            return 'current';
        }

        return 'outdated';
    }

    /**
     * @return 'inactive'|'current'|'outdated'|'unknown'
     */
    protected function pluginRowVersionStatus(bool $active, string $currentDisplay, ?string $latest): string
    {
        if (! $active) {
            return 'inactive';
        }

        return $this->versionUpgradeStatus($currentDisplay, $latest);
    }

    /**
     * @param  array<mixed>  $plugins
     */
    protected function isAssociativePluginFileMap(array $plugins): bool
    {
        if ($plugins === []) {
            return false;
        }
        $keys = array_keys($plugins);
        $firstKey = $keys[0] ?? null;
        if (! is_string($firstKey) || $firstKey === '') {
            return false;
        }
        if (! is_array($plugins[$firstKey])) {
            return false;
        }

        return str_contains($firstKey, '/') || str_ends_with(strtolower($firstKey), '.php');
    }

    /**
     * @param  array<mixed>  $plugins
     */
    protected function isListOfPluginRows(array $plugins): bool
    {
        foreach ($plugins as $p) {
            if (! is_array($p)) {
                return false;
            }
            if (! array_key_exists('slug', $p) && ! array_key_exists('file', $p)) {
                return false;
            }
        }

        return true;
    }
}
