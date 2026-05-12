import { useCallback, useRef, useState } from 'react';

export function useDeleteConfirmation(): {
    isConfirmingDelete: boolean;
    confirmDelete: (onConfirm: () => void) => void;
    executeDelete: () => void;
    cancelDelete: () => void;
} {
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const actionRef = useRef<(() => void) | null>(null);

    const confirmDelete = useCallback((onConfirm: () => void) => {
        actionRef.current = onConfirm;
        setIsConfirmingDelete(true);
    }, []);

    const executeDelete = useCallback(() => {
        actionRef.current?.();
        actionRef.current = null;
        setIsConfirmingDelete(false);
    }, []);

    const cancelDelete = useCallback(() => {
        actionRef.current = null;
        setIsConfirmingDelete(false);
    }, []);

    return { isConfirmingDelete, confirmDelete, executeDelete, cancelDelete };
}
