<?php

/**
 * Plugin Name: Zelante Connector
 * Description: Endpoint REST protetto per consultare informazioni di base sul sito (usato da CRM Zelante).
 * Version: 1.1.2
 * Author: Zelante
 * License: GPLv2 or later
 */

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

/**
 * @return non-empty-string|false
 */
function zelante_connector_read_token(): string|false
{
    $path = __DIR__.'/zelante-secret.php';
    if (! is_readable($path)) {
        return false;
    }

    $value = require $path;

    return is_string($value) && $value !== '' ? $value : false;
}

function zelante_connector_permission_check(\WP_REST_Request $request): bool|\WP_Error
{
    $expected = zelante_connector_read_token();
    if ($expected === false) {
        return new \WP_Error(
            'zelante_no_secret',
            'Zelante: file zelante-secret.php mancante o non valido.',
            ['status' => 503]
        );
    }

    $header = (string) $request->get_header('x-zelante-token');
    if ($header === '' || ! hash_equals($expected, $header)) {
        return new \WP_Error('zelante_forbidden', 'Non autorizzato.', ['status' => 401]);
    }

    return true;
}

/**
 * @return array<string, mixed>
 */
function zelante_connector_site_info_payload(): array
{
    global $wp_version;

    if (! function_exists('get_plugins')) {
        require_once ABSPATH.'wp-admin/includes/plugin.php';
    }

    $plugins = get_plugins();
    $active = function_exists('get_option') ? (array) get_option('active_plugins', []) : [];
    $activeCount = count(array_intersect(array_keys($plugins), $active));

    $theme = function_exists('wp_get_theme') ? wp_get_theme() : null;
    $themeName = $theme instanceof \WP_Theme ? (string) $theme->get('Name') : '';
    $themeStylesheet = $theme instanceof \WP_Theme ? (string) $theme->get_stylesheet() : '';
    $themeVersion = $theme instanceof \WP_Theme ? (string) $theme->get('Version') : '';

    $themesDetail = [];
    if (function_exists('wp_get_themes')) {
        $allThemes = wp_get_themes();
        if (is_array($allThemes)) {
            foreach ($allThemes as $stylesheetKey => $t) {
                if (! $t instanceof \WP_Theme) {
                    continue;
                }
                $ss = (string) $stylesheetKey;
                $themesDetail[] = [
                    'stylesheet' => $ss,
                    'slug' => $ss,
                    'name' => (string) $t->get('Name'),
                    'version' => (string) $t->get('Version'),
                    'active' => $themeStylesheet !== '' && $ss === $themeStylesheet,
                ];
            }
        }
        usort($themesDetail, static function (array $a, array $b): int {
            $aa = $a['active'] ?? false;
            $ab = $b['active'] ?? false;
            if ($aa !== $ab) {
                return $aa ? -1 : 1;
            }

            return strcasecmp((string) ($a['name'] ?? ''), (string) ($b['name'] ?? ''));
        });
    }

    $pluginsDetail = [];
    foreach ($plugins as $file => $meta) {
        if (! is_array($meta)) {
            continue;
        }
        $file = (string) $file;
        $slug = str_contains($file, '/') ? dirname($file) : pathinfo($file, PATHINFO_FILENAME);
        $slug = is_string($slug) ? $slug : '';
        $pluginsDetail[] = [
            'file' => $file,
            'slug' => $slug,
            'name' => isset($meta['Name']) ? (string) $meta['Name'] : '',
            'version' => isset($meta['Version']) ? (string) $meta['Version'] : '',
            'active' => in_array($file, $active, true),
        ];
    }

    return [
        'ok' => true,
        'wp_version' => is_string($wp_version) ? $wp_version : '',
        'php_version' => PHP_VERSION,
        'site_url' => function_exists('site_url') ? site_url() : '',
        'home_url' => function_exists('home_url') ? home_url() : '',
        'is_multisite' => is_multisite(),
        'active_theme' => $themeName,
        'active_theme_name' => $themeName,
        'active_theme_stylesheet' => $themeStylesheet,
        'active_theme_version' => $themeVersion,
        'themes' => $themesDetail,
        'themes_total_count' => count($themesDetail),
        'active_plugins_count' => $activeCount,
        'plugins_total_count' => count($plugins),
        'active_plugin_files' => array_values($active),
        'plugins' => $pluginsDetail,
        'blog_charset' => function_exists('get_option') ? (string) get_option('blog_charset', '') : '',
        'timezone_string' => function_exists('wp_timezone_string') ? wp_timezone_string() : '',
        'generated_at' => gmdate('c'),
    ];
}

add_action('rest_api_init', static function (): void {
    register_rest_route('zelante/v1', '/site-info', [
        'methods' => \WP_REST_Server::READABLE,
        'callback' => static function (): \WP_REST_Response {
            return new \WP_REST_Response(zelante_connector_site_info_payload(), 200);
        },
        'permission_callback' => static function (\WP_REST_Request $request): bool|\WP_Error {
            return zelante_connector_permission_check($request);
        },
    ]);
});
