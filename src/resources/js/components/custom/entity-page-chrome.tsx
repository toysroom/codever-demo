import { FormLoadingOverlay } from '@/components/custom/form-loading-overlay';
import { StickyFooterChrome } from '@/components/custom/sticky-entity-footer';
import { type ReactNode } from 'react';

type EntityPageChromeProps = {
    /** Barra sotto il titolo (border-b). */
    header: ReactNode;
    children: ReactNode;
    stickyBar: ReactNode;
    processing?: boolean;
    loadingMessage?: string;
};

/**
 * Corpo pagina entità: overlay caricamento, area scroll con padding basso per sticky footer, barra sticky.
 * Usato da `CrudModulePageLayout` e `PageEntityLayout` per evitare drift di markup.
 */
export function EntityPageChrome({
    header,
    children,
    stickyBar,
    processing = false,
    loadingMessage = 'Operazione in corso…',
}: EntityPageChromeProps) {
    return (
        <>
            <FormLoadingOverlay open={processing} message={loadingMessage} />
            <div className="flex h-full min-h-0 flex-1 flex-col">
                {header}
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 pb-28 md:px-6">
                        {children}
                    </div>
                    <StickyFooterChrome>{stickyBar}</StickyFooterChrome>
                </div>
            </div>
        </>
    );
}
