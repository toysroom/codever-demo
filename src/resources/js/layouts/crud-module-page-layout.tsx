import { EntityPageChrome } from '@/components/custom/entity-page-chrome';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { type ReactNode } from 'react';

type CrudModulePageLayoutProps = {
    breadcrumbs: BreadcrumbItem[];
    title: ReactNode;
    /** Titolo documento (tab browser); obbligatorio perché `title` può essere JSX. */
    documentTitle: string;
    headerActions?: ReactNode;
    /** Contenuto della barra sticky (usare `StickyFormFooterActions` / `StickyReadFooterActions` dai componenti custom). */
    stickyBar: ReactNode;
    children: ReactNode;
    processing?: boolean;
    loadingMessage?: string;
};

/** Layout full-width per pagine modulo Create / Edit / Show: header, contenuto scrollabile, barra azioni sticky in basso. */
export default function CrudModulePageLayout({
    breadcrumbs,
    title,
    documentTitle,
    headerActions,
    stickyBar,
    children,
    processing = false,
    loadingMessage = 'Operazione in corso…',
}: CrudModulePageLayoutProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={documentTitle} />
            {/*
              Altezza viewport meno header app (h-16): senza questo il main cresce col contenuto e la sticky bar
              di EntityPageChrome finisce sotto lo scroll della finestra (es. show dominio con JSON lungo).
            */}
            <div className="flex h-[calc(100svh-4rem-var(--environment-banner-height))] max-h-[calc(100svh-4rem-var(--environment-banner-height))] w-full min-h-0 flex-col overflow-hidden">
                <EntityPageChrome
                    processing={processing}
                    loadingMessage={loadingMessage}
                    stickyBar={stickyBar}
                    header={
                        <div className="flex shrink-0 flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                                <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
                            </div>
                            {headerActions ? <div className="flex shrink-0 flex-wrap gap-2">{headerActions}</div> : null}
                        </div>
                    }
                >
                    {children}
                </EntityPageChrome>
            </div>
        </AppLayout>
    );
}
