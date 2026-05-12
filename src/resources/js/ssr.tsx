import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';

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

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => (title ? `${title} - ${appName}` : appName),
        resolve: (name) => resolveInertiaPage(name),
        setup: ({ App, props }) => {
            return <App {...props} />;
        },
    }),
);
