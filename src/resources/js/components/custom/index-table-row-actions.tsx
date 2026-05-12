import { DeleteButton, DisabledDeleteButton, EditButton, ToggleActiveButton, ViewButton } from '@/components/custom/admin-ui';
import { ConfirmDeleteIconButton } from '@/components/custom/confirm-delete-icon-button';
import { type ReactNode } from 'react';

export type IndexTableRowActionsProps = {
    /** Azioni extra prima del toggle (es. probe dominio). */
    leading?: ReactNode;
    toggleActive?: {
        isActive: boolean;
        onClick: () => void;
        disabled?: boolean;
        disabledTooltip?: string;
    };
    showHref?: string;
    editHref?: string;
    onDelete: () => void;
    /** Etichetta nel dialogo di eliminazione (nome, hostname, ecc.). */
    deleteEntityLabel?: string;
    /** Testo modale eliminazione (se omesso si usa il default con deleteEntityLabel). */
    deleteDescription?: ReactNode;
    /**
     * Se true (default), eliminazione con modale di conferma.
     * Se false, un solo click invoca onDelete (es. Users/Roles con modale a livello pagina).
     */
    deleteRequiresConfirmation?: boolean;
    /** Se impostato, mostra cestino disabilitato al posto dell’elimina. */
    deleteDisabled?: { tooltip: string };
    /** Se false, non viene mostrato alcun controllo eliminazione. */
    canDelete?: boolean;
};

/**
 * Quattro azioni tabella index allineate: [leading] toggle attivo | show | edit | delete.
 * Stesso layout e stessi componenti pulsante in tutte le liste CRUD.
 */
export function IndexTableRowActions({
    leading,
    toggleActive,
    showHref,
    editHref,
    onDelete,
    deleteEntityLabel,
    deleteDescription,
    deleteRequiresConfirmation = true,
    deleteDisabled,
    canDelete = true,
}: IndexTableRowActionsProps) {
    return (
        <div className="flex flex-wrap items-center justify-end gap-2">
            {leading}
            {toggleActive ? <ToggleActiveButton {...toggleActive} /> : null}
            {showHref ? <ViewButton href={showHref} /> : null}
            {editHref ? <EditButton href={editHref} /> : null}
            {canDelete ? (
                deleteDisabled ? (
                    <DisabledDeleteButton tooltip={deleteDisabled.tooltip} />
                ) : deleteRequiresConfirmation ? (
                    <ConfirmDeleteIconButton
                        onConfirm={onDelete}
                        entityLabel={deleteEntityLabel}
                        description={deleteDescription}
                    />
                ) : (
                    <DeleteButton onClick={onDelete} />
                )
            ) : null}
        </div>
    );
}
