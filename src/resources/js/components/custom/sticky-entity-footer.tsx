import { BackToListButton } from '@/components/custom/back-to-list-button';
import { Button } from '@/components/ui/button';
import { type ReactNode } from 'react';

/** Wrapper sticky condiviso tra layout CRUD modulo e pagine entity admin. */
export function StickyFooterChrome({ children }: { children: ReactNode }) {
    return (
        <div className="sticky bottom-0 z-40 shrink-0 border-t bg-background px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] md:px-6 supports-[padding:max(0px)]:pb-[max(12px,env(safe-area-inset-bottom))]">
            <div className="flex w-full flex-wrap items-center justify-between gap-2">{children}</div>
        </div>
    );
}

/** Barra inferiore form modifica/creazione: torna lista | [extra] Salva | Salva e lista */
export function StickyFormFooterActions({
    listHref,
    listLabel = 'Torna alla lista',
    disabled = false,
    saveStayLabel = 'Salva',
    saveListLabel = 'Salva e torna alla lista',
    onSaveStay,
    onSaveList,
    trailingStart,
}: {
    listHref: string;
    listLabel?: string;
    disabled?: boolean;
    saveStayLabel?: string;
    saveListLabel?: string;
    onSaveStay: () => void;
    onSaveList: () => void;
    trailingStart?: ReactNode;
}) {
    return (
        <>
            <BackToListButton href={listHref} disabled={disabled}>
                {listLabel}
            </BackToListButton>
            <div className="flex flex-wrap items-center gap-2">
                {trailingStart}
                <Button type="button" disabled={disabled} onClick={onSaveStay}>
                    {saveStayLabel}
                </Button>
                <Button type="button" variant="secondary" disabled={disabled} onClick={onSaveList}>
                    {saveListLabel}
                </Button>
            </div>
        </>
    );
}

/** Scheda dettaglio / sola lettura: torna lista | azioni (es. Modifica) */
export function StickyReadFooterActions({
    listHref,
    listLabel = 'Torna alla lista',
    disabled = false,
    children,
}: {
    listHref: string;
    listLabel?: string;
    disabled?: boolean;
    children?: ReactNode;
}) {
    return (
        <>
            <BackToListButton href={listHref} disabled={disabled}>
                {listLabel}
            </BackToListButton>
            <div className="flex flex-wrap items-center gap-2">{children}</div>
        </>
    );
}
