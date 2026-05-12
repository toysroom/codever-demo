import { useCallback, useState } from 'react';

type ExportParams = Record<string, unknown>;

export function useExport(options: { exportRoute: string; resourceName: string }): {
    isExporting: boolean;
    exportData: (params: ExportParams) => void;
} {
    const [isExporting, setIsExporting] = useState(false);

    const exportData = useCallback(
        (params: ExportParams) => {
            void options.resourceName;
            setIsExporting(true);
            try {
                const base = options.exportRoute;
                const search = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    if (value === undefined || value === null) {
                        return;
                    }
                    if (typeof value === 'object' && !Array.isArray(value)) {
                        search.set(key, JSON.stringify(value));

                        return;
                    }
                    search.set(key, String(value));
                });
                const qs = search.toString();
                window.open(qs ? `${base}?${qs}` : base, '_blank', 'noopener,noreferrer');
            } finally {
                setIsExporting(false);
            }
        },
        [options.exportRoute, options.resourceName],
    );

    return { isExporting, exportData };
}
