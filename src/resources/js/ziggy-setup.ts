import { route as ziggyRoute } from 'ziggy-js';
import type { Config } from 'ziggy-js';
import { Ziggy } from './ziggy.js';

function currentConfig(): Config {
    const fallbackUrl = typeof Ziggy.url === 'string' ? Ziggy.url.replace(/\/$/, '') : '';
    const origin =
        typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : fallbackUrl;

    return {
        ...Ziggy,
        url: origin || fallbackUrl,
        routes: Ziggy.routes,
    } as Config;
}

const cfg = currentConfig();
(globalThis as unknown as { Ziggy: Config }).Ziggy = cfg;

(globalThis as unknown as { route: typeof ziggyRoute }).route = ((
    name: string,
    params?: unknown,
    absolute?: boolean,
): string =>
    String(
        ziggyRoute(
            name as never,
            params as never,
            absolute ?? false,
            typeof window !== 'undefined' ? currentConfig() : cfg,
        ),
    )) as typeof ziggyRoute;
