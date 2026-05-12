import { type ReactNode } from 'react';

export type PdfTemplateInfo = {
    key: string;
    label: string;
};

type Props = {
    templates: PdfTemplateInfo[];
    showSettingsLinkHint?: boolean;
};

/** Stub: sostituisci con il pannello mappature PDF dell’altro progetto se serve. */
export function DocumentPdfFieldMapsPanel({ templates, showSettingsLinkHint }: Props): ReactNode {
    void templates;
    void showSettingsLinkHint;

    return (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            PDF field maps panel (stub). Nessuna mappatura configurata in questo ambiente.
        </div>
    );
}
