<?php

namespace App\Modules\Web\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class WebWordPressConnectorClient
{
    public function __construct(
        protected WebSiteProbeService $siteProbe,
    ) {}

    /**
     * GET REST `zelante/v1/site-info` sul sito WordPress (header token).
     *
     * @return array<string, mixed>
     */
    public function fetchSiteInfo(string $hostname, string $plainToken): array
    {
        $plainToken = trim($plainToken);
        if ($plainToken === '') {
            return [
                'ok' => false,
                'message' => __('Token connettore mancante.'),
            ];
        }

        $validated = $this->siteProbe->validatedOutboundStartUrl($hostname);
        if (! $validated['ok']) {
            return [
                'ok' => false,
                'message' => $validated['error_message'],
            ];
        }

        $url = rtrim($validated['start_url'], '/').'/wp-json/zelante/v1/site-info';

        try {
            /** @var Response $response */
            $response = Http::timeout(25)
                ->connectTimeout(10)
                ->withHeaders([
                    'User-Agent' => 'ZelanteWordPressConnector/1.0 (+https://app.zelante.it)',
                    'Accept' => 'application/json',
                    'X-Zelante-Token' => $plainToken,
                ])
                ->withOptions(['allow_redirects' => false])
                ->get($url);
        } catch (\Throwable $e) {
            report($e);

            return [
                'ok' => false,
                'message' => Str::limit($e->getMessage(), 400),
            ];
        }

        $json = $response->json();
        if (is_array($json)) {
            try {
                /** @var array<string, mixed> $normalized */
                $normalized = json_decode(json_encode($json, JSON_THROW_ON_ERROR), true, 512, JSON_THROW_ON_ERROR);

                return is_array($normalized) ? $normalized : $json;
            } catch (\JsonException) {
                return $json;
            }
        }

        return [
            'ok' => false,
            'message' => __('Risposta non JSON dal sito (HTTP :status).', ['status' => $response->status()]),
            'http_status' => $response->status(),
            'body_preview' => Str::limit($response->body(), 400),
        ];
    }

    /**
     * Verifica se il plugin è caricato e attivo interrogando l’indice REST (`/wp-json/`): i namespace
     * sono registrati solo per i plugin attivi.
     *
     * @return array{ok: bool, plugin_active: bool|null, discovery_url?: string, message: string, http_status?: int}
     */
    public function probeConnectorPluginActive(string $hostname): array
    {
        $validated = $this->siteProbe->validatedOutboundStartUrl($hostname);
        if (! $validated['ok']) {
            return [
                'ok' => false,
                'plugin_active' => null,
                'message' => $validated['error_message'],
            ];
        }

        $base = rtrim($validated['start_url'], '/');
        $candidates = [$base.'/wp-json/', $base.'/wp-json'];

        foreach ($candidates as $discoveryUrl) {
            try {
                /** @var Response $response */
                $response = Http::timeout(25)
                    ->connectTimeout(10)
                    ->withHeaders([
                        'User-Agent' => 'ZelanteWordPressConnector/1.0 (+https://app.zelante.it)',
                        'Accept' => 'application/json',
                    ])
                    ->withOptions(['allow_redirects' => false])
                    ->get($discoveryUrl);
            } catch (\Throwable $e) {
                report($e);

                return [
                    'ok' => false,
                    'plugin_active' => null,
                    'message' => Str::limit($e->getMessage(), 400),
                ];
            }

            $status = $response->status();
            $contentType = strtolower($response->getHeaderLine('Content-Type'));
            if ($status < 200 || $status >= 300) {
                continue;
            }
            if ($contentType !== '' && ! str_contains($contentType, 'json')) {
                return [
                    'ok' => false,
                    'plugin_active' => null,
                    'message' => __('La risposta dell’indice REST non è JSON (Content-Type non atteso).'),
                    'http_status' => $status,
                    'discovery_url' => $discoveryUrl,
                ];
            }

            $json = $response->json();
            if (! is_array($json)) {
                return [
                    'ok' => false,
                    'plugin_active' => null,
                    'message' => __('Impossibile interpretare l’indice REST WordPress.'),
                    'http_status' => $status,
                    'discovery_url' => $discoveryUrl,
                ];
            }

            $namespaces = $json['namespaces'] ?? null;
            if (! is_array($namespaces)) {
                return [
                    'ok' => false,
                    'plugin_active' => null,
                    'message' => __('Indice REST senza elenco `namespaces` (sito non WordPress o REST disabilitata).'),
                    'discovery_url' => $discoveryUrl,
                ];
            }

            $active = in_array('zelante/v1', $namespaces, true);

            return [
                'ok' => true,
                'plugin_active' => $active,
                'discovery_url' => $discoveryUrl,
                'message' => $active
                    ? __('Il plugin Zelante Connector risulta attivo (namespace `zelante/v1` registrato in REST).')
                    : __('Il namespace `zelante/v1` non risulta nell’indice REST: plugin non attivo, non installato, o REST oscurata da sicurezza / cache.'),
            ];
        }

        return [
            'ok' => false,
            'plugin_active' => null,
            'message' => __('Impossibile leggere l’indice REST WordPress (nessuna URL `/wp-json` risponde con successo).'),
        ];
    }
}
