<?php

namespace App\Modules\Web\Services;

use App\Modules\Web\Support\WebDomainUrlNormalizer;
use GuzzleHttp\Psr7\Uri;
use GuzzleHttp\Psr7\UriResolver;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class WebSiteProbeService
{
    private static function maxRedirectHops(): int
    {
        return 8;
    }

    private static function bodySnippetCharLimit(): int
    {
        return 120000;
    }

    /**
     * Stessa policy host/DNS di {@see self::probe()} per richieste HTTP in uscita verso il dominio registrato.
     *
     * @return array{ok: true, start_url: string}|array{ok: false, error_message: string}
     */
    public function validatedOutboundStartUrl(string $raw): array
    {
        $parsed = WebDomainUrlNormalizer::probeParts($raw);
        $v = $this->validateParsedHostnameForOutbound($parsed);

        return $v['ok']
            ? ['ok' => true, 'start_url' => $parsed['start_url']]
            : ['ok' => false, 'error_message' => $v['error_message']];
    }

    /**
     * @param  array{start_url: string, dns_host: string, normalized_label: string}  $parsed
     * @return array{ok: true}|array{ok: false, error_message: string}
     */
    protected function validateParsedHostnameForOutbound(array $parsed): array
    {
        $dnsHost = $parsed['dns_host'];

        if ($dnsHost === '' || str_contains($dnsHost, '/')) {
            return ['ok' => false, 'error_message' => __('URL o host non valido.')];
        }

        if (filter_var($dnsHost, FILTER_VALIDATE_IP)) {
            return ['ok' => false, 'error_message' => __('Non è consentito interrogare direttamente un indirizzo IP.')];
        }

        foreach (['_', '..'] as $bad) {
            if (Str::contains($dnsHost, $bad)) {
                return ['ok' => false, 'error_message' => __('Host non valido.')];
            }
        }

        foreach (['localhost', '.local'] as $marker) {
            if ($dnsHost === $marker || Str::endsWith($dnsHost, '.'.$marker) || str_contains($dnsHost, '.local.')) {
                return ['ok' => false, 'error_message' => __('Host riservati non sono consentiti.')];
            }
        }

        $ips = $this->resolvePublicIpv4Addresses($dnsHost);
        if ($ips === []) {
            return ['ok' => false, 'error_message' => __('Impossibile risolvere il dominio in un IPv4 pubblico (rete interna vietata o DNS non disponibile).')];
        }

        return ['ok' => true];
    }

    /**
     * @return array<string, mixed>
     */
    public function probe(string $raw): array
    {
        $started = microtime(true);
        $parsed = WebDomainUrlNormalizer::probeParts($raw);

        $dnsHost = $parsed['dns_host'];
        $displayLabel = $parsed['normalized_label'];
        $startUrl = $parsed['start_url'];

        $base = [
            'hostname' => $displayLabel,
            'resolved_ips' => [],
            'scheme_used' => null,
            'final_url' => null,
            'status_code' => null,
            'reachable' => false,
            'error_message' => null,
            'duration_ms' => 0,
            'content_type' => null,
            'charset' => null,
            'title' => null,
            'server_header' => null,
            'powered_by_headers' => [],
            'redirect_count' => 0,
            'redirect_chain' => [],
            'framework_hints' => [],
        ];

        $validation = $this->validateParsedHostnameForOutbound($parsed);
        if (! $validation['ok']) {
            return $this->withDuration(array_merge($base, [
                'error_message' => $validation['error_message'],
            ]), $started);
        }

        $ips = $this->resolvePublicIpv4Addresses($dnsHost);
        $base['resolved_ips'] = $ips;

        $isExplicitHttpUserUrl = preg_match('#^http://#i', trim($raw)) === 1;

        if ($isExplicitHttpUserUrl) {
            $httpFirst = $this->fetchWithRedirects($startUrl, $dnsHost);
            if ($httpFirst['ok']) {
                $payload = array_merge($base, $httpFirst['data']);
                $payload['scheme_used'] = 'http';
                $payload['reachable'] = true;

                return $this->finalize($payload, $started);
            }

            $httpErr = $httpFirst['data']['error_message'] ?? __('HTTP non riuscito.');
            $httpsUrl = preg_replace('#^http://#i', 'https://', $startUrl, 1);
            $httpsSecond = $this->fetchWithRedirects($httpsUrl, $dnsHost);
            if ($httpsSecond['ok']) {
                $payload = array_merge($base, $httpsSecond['data']);
                $payload['scheme_used'] = 'https';
                $payload['reachable'] = true;

                return $this->finalize($payload, $started);
            }

            return $this->finalize(array_merge($base, $httpsSecond['data'], [
                'error_message' => ($httpsSecond['data']['error_message'] ?? '').' ('.__('fallback HTTP').': '.$httpErr.')',
            ]), $started);
        }

        /** Default: prima HTTPS (URL https://… o dominio storico senza scheme). */
        $httpsCandidate = preg_match('#^https://#i', $startUrl) === 1
            ? $startUrl
            : 'https://'.$dnsHost.'/';

        $httpsResult = $this->fetchWithRedirects($httpsCandidate, $dnsHost);
        if ($httpsResult['ok']) {
            $payload = array_merge($base, $httpsResult['data']);
            $payload['scheme_used'] = 'https';
            $payload['reachable'] = true;

            return $this->finalize($payload, $started);
        }

        $httpsErr = $httpsResult['data']['error_message'] ?? __('HTTPS non riuscito.');
        $httpFallback = preg_match('#^http://#i', $startUrl) === 1
            ? $startUrl
            : 'http://'.$dnsHost.'/';

        $httpResult = $this->fetchWithRedirects($httpFallback, $dnsHost);
        if ($httpResult['ok']) {
            $payload = array_merge($base, $httpResult['data']);
            $payload['scheme_used'] = 'http';
            $payload['reachable'] = true;

            return $this->finalize($payload, $started);
        }

        return $this->finalize(array_merge($base, $httpResult['data'], [
            'error_message' => ($httpResult['data']['error_message'] ?? '').' ('.__('fallback HTTPS').': '.$httpsErr.')',
            'reachable' => ($httpResult['data']['status_code'] ?? null) !== null && ($httpResult['data']['status_code'] ?? 0) > 0,
        ]), $started);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    protected function finalize(array $payload, float $started): array
    {
        $snippet = isset($payload['body_snippet']) && is_string($payload['body_snippet']) ? $payload['body_snippet'] : '';
        unset($payload['body_snippet']);

        $headersBlob = isset($payload['headers_blob']) && is_string($payload['headers_blob']) ? $payload['headers_blob'] : '';
        unset($payload['headers_blob']);

        $payload['framework_hints'] = $this->inferFrameworks(
            $snippet,
            $headersBlob,
            isset($payload['server_header']) ? (string) $payload['server_header'] : '',
            isset($payload['powered_by_headers']) && is_array($payload['powered_by_headers']) ? $payload['powered_by_headers'] : [],
        );

        return $this->withDuration($payload, $started);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    protected function withDuration(array $payload, float $started): array
    {
        $payload['duration_ms'] = (int) round((microtime(true) - $started) * 1000);

        return $payload;
    }

    /**
     * @return array{ok: bool, data: array<string, mixed>}
     */
    protected function fetchWithRedirects(string $startUrl, string $canonicalHost): array
    {
        $redirectChain = [];

        try {
            $currentUri = new Uri($startUrl);

            for ($hop = 0; $hop < self::maxRedirectHops(); $hop++) {
                $host = $currentUri->getHost();
                if ($host === '') {
                    return ['ok' => false, 'data' => ['error_message' => __('URL non valido.'), 'redirect_chain' => $redirectChain]];
                }

                if (! $this->hostsAreCompatible($canonicalHost, $host)) {
                    return ['ok' => false, 'data' => [
                        'error_message' => __('Redirect verso un host diverso dal dominio non è consentito: ').$host,
                        'redirect_count' => $hop,
                        'redirect_chain' => $redirectChain,
                    ]];
                }

                $ipsForHop = $this->resolvePublicIpv4Addresses($host);
                if ($ipsForHop === []) {
                    return ['ok' => false, 'data' => [
                        'error_message' => __('Host di redirect senza IPv4 pubblico: ').$host,
                        'redirect_count' => $hop,
                        'redirect_chain' => $redirectChain,
                    ]];
                }

                $url = (string) $currentUri;

                /** @var Response $response */
                $response = Http::timeout(15)
                    ->connectTimeout(8)
                    ->withHeaders([
                        'User-Agent' => 'ZelanteDomainProbe/1.0 (+https://app.zelante.it)',
                        'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language' => 'it-IT,it;q=0.9,en;q=0.7',
                    ])
                    ->withOptions(['allow_redirects' => false])
                    ->get($url);

                $status = $response->status();
                $redirectStatuses = [301, 302, 303, 307, 308];

                if (in_array($status, $redirectStatuses, true)) {
                    $location = $response->getHeaderLine('Location');
                    if ($location === '') {
                        return ['ok' => false, 'data' => [
                            'status_code' => $status,
                            'error_message' => __('Redirect senza Location.'),
                            'redirect_count' => $hop,
                            'redirect_chain' => array_merge($redirectChain, [['status' => $status, 'location' => null]]),
                        ]];
                    }

                    $redirectChain[] = ['status' => $status, 'location' => $location];

                    try {
                        $currentUri = UriResolver::resolve($currentUri, new Uri($location));
                    } catch (\Throwable) {
                        return ['ok' => false, 'data' => [
                            'error_message' => __('URL di redirect malformato.'),
                            'redirect_count' => $hop,
                            'redirect_chain' => $redirectChain,
                        ]];
                    }

                    continue;
                }

                $body = mb_substr($response->body(), 0, self::bodySnippetCharLimit());
                [$contentType, $charset] = $this->parseContentTypeHeader(
                    ($ct = $response->getHeaderLine('Content-Type')) !== '' ? $ct : null
                );

                $headersBlob = $this->flattenHeadersBlob($response);
                $powered = $this->extractPoweredBy($response);

                return ['ok' => true, 'data' => [
                    'final_url' => $url,
                    'status_code' => $status,
                    'reachable' => true,
                    'redirect_count' => $hop,
                    'redirect_chain' => $redirectChain,
                    'content_type' => $contentType,
                    'charset' => $charset,
                    'title' => $this->extractTitle($body),
                    'server_header' => $response->getHeaderLine('Server') ?: null,
                    'powered_by_headers' => $powered,
                    'headers_blob' => $headersBlob,
                    'body_snippet' => $body,
                ]];
            }

            return ['ok' => false, 'data' => [
                'error_message' => __('Troppi reindirizzamenti.'),
                'redirect_count' => self::maxRedirectHops(),
                'redirect_chain' => $redirectChain,
            ]];
        } catch (\Throwable $e) {
            return ['ok' => false, 'data' => [
                'error_message' => Str::limit($e->getMessage(), 280),
                'redirect_chain' => $redirectChain,
            ]];
        }
    }

    protected function flattenHeadersBlob(Response $response): string
    {
        $rows = [];
        foreach ($response->getHeaders() as $name => $values) {
            foreach ((array) $values as $v) {
                $rows[] = strtolower((string) $name).': '.$v;
            }
        }

        return implode("\n", $rows);
    }

    /**
     * @return array<int, string>
     */
    protected function extractPoweredBy(Response $response): array
    {
        $vals = [];
        foreach ($response->getHeader('X-Powered-By') as $v) {
            $vals[] = (string) $v;
        }

        return array_values(array_unique($vals));
    }

    /**
     * @return array{0: ?string, 1: ?string}
     */
    protected function parseContentTypeHeader(?string $header): array
    {
        if ($header === null || $header === '') {
            return [null, null];
        }

        $parts = array_map('trim', explode(';', $header));
        $contentType = $parts[0] ?? null;

        $charset = null;
        foreach (array_slice($parts, 1) as $p) {
            if (preg_match('/charset\s*=\s*([\w\-]+)/i', $p, $m)) {
                $charset = strtolower($m[1]);

                break;
            }
        }

        return [$contentType ?: null, $charset];
    }

    protected function extractTitle(string $html): ?string
    {
        if (preg_match('/<title[^>]*>\s*(.*?)\s*<\/title>/is', $html, $m)) {
            $t = trim(html_entity_decode(strip_tags($m[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8'));

            return $t !== '' ? Str::limit($t, 200) : null;
        }

        return null;
    }

    protected function hostsAreCompatible(string $canonical, ?string $candidate): bool
    {
        $a = strtolower(trim($canonical));
        $b = strtolower(trim((string) $candidate));

        if ($a === $b) {
            return true;
        }

        return $this->stripLeadingWww($a) === $this->stripLeadingWww($b);
    }

    protected function stripLeadingWww(string $host): string
    {
        return Str::startsWith($host, 'www.') ? substr($host, 4) : $host;
    }

    /**
     * @return list<string>
     */
    protected function resolvePublicIpv4Addresses(string $hostname): array
    {
        $ips = [];

        foreach ($this->dnsARecordsIpv4($hostname) as $ip) {
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                $ips[] = $ip;
            }
        }

        $fallback = @gethostbynamel($hostname);
        if ($fallback !== false) {
            foreach ((array) $fallback as $ip) {
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    $ips[] = $ip;
                }
            }
        }

        /** @var list<string> */
        return array_values(array_unique($ips));
    }

    /**
     * @return list<string>
     */
    protected function dnsARecordsIpv4(string $hostname): array
    {
        if (! function_exists('dns_get_record')) {
            return [];
        }

        $records = @dns_get_record($hostname, DNS_A);
        if ($records === false || ! is_array($records)) {
            return [];
        }

        $out = [];
        foreach ($records as $r) {
            if (isset($r['type'], $r['ip']) && $r['type'] === 'A' && filter_var($r['ip'], FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                $out[] = $r['ip'];
            }
        }

        return $out;
    }

    /**
     * @param  array<int, string>  $poweredBy
     * @return array<int, array{name: string, confidence: string, clues: array<int, string>}>
     */
    protected function inferFrameworks(string $snippet, string $headersBlob, string $server, array $poweredBy): array
    {
        $body = strtolower($snippet);
        foreach ($poweredBy as $p) {
            $headersBlob .= "\n".$p;
        }

        $serverLow = strtolower($server);

        $hits = [];

        $try = static function (
            callable $predicate,
            string $name,
            string $confidence,
            string ...$clues
        ) use (&$hits): void {
            if ($predicate()) {
                $hits[] = [
                    'name' => $name,
                    'confidence' => $confidence,
                    'clues' => array_values(array_filter($clues)),
                ];
            }
        };

        $try(fn () => str_contains($body, '/wp-content/') || str_contains($body, '/wp-includes/') ||
            preg_match('/<meta\s+name="generator"\s+[^>]*wordpress/i', $snippet) === 1,
            'WordPress',
            'high',
            __('Percorsi /wp-* o meta generator WordPress.')
        );

        $try(fn () => preg_match('/set-cookie:[^\r\n]*laravel_session=/i', $headersBlob) === 1 ||
            (
                preg_match('/<meta\s+name="csrf-token"\s+content=/i', $snippet) === 1 &&
                preg_match('/@vite\b|@inertia|\/build\/assets\/|manifest\.json/i', $snippet) === 1
            ),
            'Laravel',
            'high',
            __('Cookie di sessione Laravel e/o stack tipico Vite/Inertia.')
        );

        $try(fn () => str_contains($body, 'csrftoken') && str_contains($body, 'csrfmiddlewaretoken'),
            'Django',
            'high',
            __('Token CSRF caratteristici di Django.')
        );

        $try(fn () => str_contains($headersBlob, '__cf_bm') || str_contains($headersBlob, 'cf-ray') || preg_match('/\bcloudflare\b/i', $snippet) === 1,
            'Cloudflare',
            'low',
            __('Header CDN / challenge')
        );

        $try(fn () => str_contains($body, '/_next/static') || preg_match('/<script[^>]+__NEXT_DATA__/i', $snippet) === 1,
            'Next.js',
            'high'
        );

        $try(fn () => preg_match('/window\.__NUXT__|__NUXT__|\/_nuxt\//i', $snippet) === 1,
            'Nuxt',
            'high'
        );

        $try(fn () => preg_match('/<meta\s+name="generator"\s+content=["\']astro/i', $snippet) === 1,
            'Astro',
            'medium'
        );

        $try(fn () => str_contains($body, 'cdn.shopify.com'),
            'Shopify',
            'high'
        );

        $try(fn () => str_contains($body, 'static.wixstatic') || str_contains($body, 'wixstatic.com'),
            'Wix',
            'medium'
        );

        $try(fn () => str_contains($body, 'static.squarespace.com'),
            'Squarespace',
            'medium'
        );

        $try(fn () => str_contains($body, '__requestverificationtoken') || str_contains($headersBlob, 'x-aspnet'),
            'ASP.NET',
            'medium'
        );

        $try(fn () => str_contains($serverLow, 'php') || preg_match('/\bx-powered-by:.+php\//', $headersBlob) === 1,
            'PHP',
            'low',
            __('Server o X-Powered-By espone PHP')
        );

        $try(fn () => str_contains($headersBlob, 'express'),
            'Express.js',
            'low',
            __('Header X-Powered-By o stack Node.js tipico.')
        );

        $try(
            fn (): bool => preg_match('/set-cookie:[^\r\n]*laravel_session=/i', $headersBlob) !== 1
                && (
                    str_contains($headersBlob, '_rails')
                    || preg_match('/<meta\s+name="csrf-param"\s+content="authenticity_token"/', $snippet) === 1
                ),
            'Ruby on Rails',
            'medium',
            __('Cookie / meta tipici di Rails.')
        );

        $try(fn () => str_contains($body, '_sf_container') || str_contains($headersBlob, 'symfony'),
            'Symfony',
            'medium'
        );

        if ($hits === []) {
            return [[
                'name' => __('Non determinato'),
                'confidence' => 'low',
                'clues' => [__('Nessuna firma riconosciuta nei contenuti/HTML e negli header restituiti.')],
            ]];
        }

        $seen = [];
        $deduped = [];
        foreach ($hits as $h) {
            $key = $h['name'];
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $deduped[] = [
                'name' => $h['name'],
                'confidence' => $h['confidence'],
                'clues' => $h['clues'] !== [] ? $h['clues'] : [__('Pattern corrispondente ai criteri euristici.')],
            ];
        }

        return $deduped;
    }

    /**
     * Testo compatto per colonna stack da elenco framework_hints del probe.
     *
     * @param  array<int, mixed>  $frameworkHints  Elenco hint dal probe (vedi inferFrameworks).
     */
    public function summarizeFrameworkStack(array $frameworkHints): string
    {
        if ($frameworkHints === []) {
            return '';
        }

        $rank = static fn (string $c): int => match (strtolower($c)) {
            'high' => 0,
            'medium' => 1,
            'low' => 2,
            default => 3,
        };

        usort($frameworkHints, static function ($a, $b) use ($rank): int {
            $ca = is_array($a) ? (string) ($a['confidence'] ?? 'low') : 'low';
            $cb = is_array($b) ? (string) ($b['confidence'] ?? 'low') : 'low';

            return $rank($ca) <=> $rank($cb);
        });

        $parts = [];
        foreach ($frameworkHints as $h) {
            if (! is_array($h)) {
                continue;
            }
            $name = trim((string) ($h['name'] ?? ''));
            if ($name === '') {
                continue;
            }
            $conf = strtolower((string) ($h['confidence'] ?? ''));
            $parts[] = $conf !== '' ? "{$name} ({$conf})" : $name;
        }

        return implode(' · ', $parts);
    }
}
