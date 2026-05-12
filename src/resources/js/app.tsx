import '../css/app.css';
import './ziggy-setup';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Fragment, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const pages = import.meta.glob('./pages/**/*.tsx');

function resolveInertiaPage(name: string) {
    const primary = `./pages/${name}.tsx`;
    if (pages[primary]) {
        return resolvePageComponent(primary, pages);
    }
    const needle = `${name}.tsx`.replace(/\\/g, '/');
    const key = Object.keys(pages).find((k) => k.replace(/\\/g, '/').endsWith(needle));
    if (!key) {
        throw new Error(`Page not found: ${primary}`);
    }

    return resolvePageComponent(key, pages);
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => resolveInertiaPage(name),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <Fragment>
                    <App {...props} />
                    <Toaster richColors position="top-right" />
                </Fragment>
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
