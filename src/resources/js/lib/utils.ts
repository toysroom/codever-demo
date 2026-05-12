import { InertiaLinkProps } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isSameUrl(
    url1: NonNullable<InertiaLinkProps['href']>,
    url2: NonNullable<InertiaLinkProps['href']>,
) {
    return resolveUrl(url1) === resolveUrl(url2);
}

export function resolveUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

/** Path corrente senza query, senza slash finale (eccetto root). */
export function normalizePagePath(url: string): string {
    let s = (url || '/').trim() || '/';
    if (s.startsWith('http')) {
        try {
            s = new URL(s).pathname;
        } catch {
            /* keep s */
        }
    }
    const q = s.indexOf('?');
    if (q !== -1) {
        s = s.slice(0, q);
    }
    if (s.length > 1 && s.endsWith('/')) {
        s = s.slice(0, -1);
    }
    return s || '/';
}

/** Voce menu attiva: match esatto o sottopercorso (boundary sicuro su `/`). */
export function isNavItemActive(
    pageUrl: string,
    itemHref: NonNullable<InertiaLinkProps['href']>,
): boolean {
    const path = normalizePagePath(pageUrl);
    const target = normalizePagePath(resolveUrl(itemHref));
    if (path === target) {
        return true;
    }
    return path.startsWith(`${target}/`);
}

/**
 * Evidenziazione sidebar: tra tutti gli href della barra laterale conta attiva solo
 * la voce col match più specifico (path normalizzato più lungo), così prefissi tipo
 * `/modules/customers` non restano evidenziati su `/modules/customers/customer-types`.
 */
export function isSidebarNavItemActive(
    pageUrl: string,
    itemHref: NonNullable<InertiaLinkProps['href']>,
    allSidebarHrefs: NonNullable<InertiaLinkProps['href']>[],
): boolean {
    const path = normalizePagePath(pageUrl);
    const normalized = [...new Set(allSidebarHrefs.map((h) => normalizePagePath(resolveUrl(h))))];
    const matches = normalized.filter(
        (target) => path === target || path.startsWith(`${target}/`),
    );
    if (matches.length === 0) {
        return false;
    }
    const best = matches.reduce((a, b) => (a.length >= b.length ? a : b));
    return normalizePagePath(resolveUrl(itemHref)) === best;
}
