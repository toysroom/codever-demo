<?php

namespace App\Modules\Web\Support;

use Illuminate\Support\Str;

class WebDomainUrlNormalizer
{
    /**
     * Normalizza l’URL salvato: scheme e host in minuscolo, path di default “/” se assente.
     */
    public static function normalizeStoredUrl(string $raw): string
    {
        $raw = trim($raw);
        if ($raw === '') {
            return $raw;
        }

        if (preg_match('#^https?://#i', $raw)) {
            $p = parse_url($raw);
            if ($p === false || empty($p['host'])) {
                return $raw;
            }

            $scheme = strtolower((string) ($p['scheme'] ?? 'http'));
            $host = strtolower((string) $p['host']);
            $port = isset($p['port']) ? ':'.$p['port'] : '';

            $path = $p['path'] ?? '';
            if ($path === '' || $path === '/') {
                $path = '/';
            }

            $query = isset($p['query']) ? '?'.$p['query'] : '';
            $fragment = isset($p['fragment']) ? '#'.$p['fragment'] : '';

            return $scheme.'://'.$host.$port.$path.$query.$fragment;
        }

        return Str::lower($raw);
    }

    /**
     * @return array{start_url: string, dns_host: string, normalized_label: string}
     */
    public static function probeParts(string $raw): array
    {
        $normalized = self::normalizeStoredUrl($raw);

        if (preg_match('#^https?://#i', $normalized)) {
            $p = parse_url($normalized);
            if ($p === false || empty($p['host'])) {
                return [
                    'start_url' => 'https://invalid/',
                    'dns_host' => '',
                    'normalized_label' => $normalized,
                ];
            }

            $scheme = strtolower((string) ($p['scheme'] ?? 'http'));
            $host = strtolower((string) $p['host']);
            $port = isset($p['port']) ? ':'.$p['port'] : '';

            $path = $p['path'] ?? '';
            if ($path === '') {
                $path = '/';
            }

            $query = isset($p['query']) ? '?'.$p['query'] : '';
            $start = $scheme.'://'.$host.$port.$path.$query;

            return [
                'start_url' => $start,
                'dns_host' => $host,
                'normalized_label' => $normalized,
            ];
        }

        $host = strtolower(trim($normalized));

        return [
            'start_url' => 'https://'.$host.'/',
            'dns_host' => $host,
            'normalized_label' => $host,
        ];
    }
}
