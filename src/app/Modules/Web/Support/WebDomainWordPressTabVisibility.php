<?php

namespace App\Modules\Web\Support;

use App\Models\WebDomain;

class WebDomainWordPressTabVisibility
{
    /**
     * Tab WordPress in modifica dominio: visibile se l’ultima scansione o lo stack indicano WordPress.
     */
    public static function isVisible(WebDomain $domain): bool
    {
        $stack = strtolower((string) ($domain->stack ?? ''));
        if (str_contains($stack, 'wordpress')) {
            return true;
        }

        $lastScan = $domain->last_scan;
        if (! is_array($lastScan)) {
            return false;
        }

        $probe = $lastScan['probe'] ?? null;
        if (! is_array($probe)) {
            return false;
        }

        $hints = $probe['framework_hints'] ?? null;
        if (! is_array($hints)) {
            return false;
        }

        foreach ($hints as $hint) {
            if (! is_array($hint)) {
                continue;
            }
            $name = trim((string) ($hint['name'] ?? ''));
            if ($name !== 'WordPress') {
                continue;
            }
            $conf = strtolower((string) ($hint['confidence'] ?? ''));
            if (in_array($conf, ['high', 'medium'], true)) {
                return true;
            }
        }

        return false;
    }
}
