import { EntityPageChrome } from '@/components/custom/entity-page-chrome';
import { StickyFormFooterActions, StickyReadFooterActions } from '@/components/custom/sticky-entity-footer';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { type ReactNode } from 'react';

export type PageEntityFooterMode = 'form' | 'readonly';

type PageEntityLayoutProps = {
    title: string;
    description?: string;
    breadcrumbs?: BreadcrumbItem[];
    headerActions?: ReactNode;
    children: ReactNode;
    footerMode: PageEntityFooterMode;
    listHref: string;
    listLabel?: string;
    processing?: boolean;
    loadingMessage?: string;
    saveStayLabel?: string;
    saveListLabel?: string;
    /** Salva restando nella pagina (o sulla pagina di modifica dopo create) */
    onSaveStay?: () => void;
    /** Salva e torna all’elenco */
    onSaveList?: () => void;
    readonlyTrailing?: ReactNode;
};

export default function PageEntityLayout({
    title,
    description,
    breadcrumbs = [],
    headerActions,
    children,
    footerMode,
    listHref,
    listLabel = 'Torna alla lista',
    processing = false,
    loadingMessage = 'Operazione in corso…',
    saveStayLabel = 'Salva',
    saveListLabel = 'Salva e torna alla lista',
    onSaveStay,
    onSaveList,
    readonlyTrailing,
}: PageEntityLayoutProps) {
    const overlayOpen = processing;

    const stickyBar =
        footerMode === 'form' && onSaveStay && onSaveList ? (
            <StickyFormFooterActions
                listHref={listHref}
                listLabel={listLabel}
                disabled={overlayOpen}
                saveStayLabel={saveStayLabel}
                saveListLabel={saveListLabel}
                onSaveStay={onSaveStay}
                onSaveList={onSaveList}
            />
        ) : (
            <StickyReadFooterActions listHref={listHref} listLabel={listLabel} disabled={overlayOpen}>
                {readonlyTrailing}
            </StickyReadFooterActions>
        );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />
            <div className="flex h-[calc(100svh-4rem-var(--environment-banner-height))] max-h-[calc(100svh-4rem-var(--environment-banner-height))] w-full min-h-0 flex-col overflow-hidden">
                <EntityPageChrome
                    processing={processing}
                    loadingMessage={loadingMessage}
                    stickyBar={stickyBar}
                    header={
                        <div className="flex shrink-0 flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-start sm:justify-between md:px-6">
                            <div className="min-w-0 space-y-1">
                                <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
                                {description ? <p className="max-w-none text-sm text-muted-foreground">{description}</p> : null}
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
