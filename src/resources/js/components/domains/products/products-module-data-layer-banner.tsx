import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

type DataLayer = 'redis' | 'database' | null | undefined;

export function ProductsModuleDataLayerBanner({ layer }: { layer: DataLayer }) {
    const page = usePage<SharedData>();
    const copy = page.props.ui?.products_module;

    if (layer == null || !copy) {
        return null;
    }

    return (
        <Alert className="border-dashed border-amber-500/40 bg-amber-500/5 dark:border-amber-400/30 dark:bg-amber-400/10">
            <AlertTitle>{copy.didactic_title}</AlertTitle>
            <AlertDescription className="space-y-1">
                <p>{layer === 'redis' ? copy.from_redis : copy.from_database}</p>
                <p className="text-muted-foreground text-xs">{copy.strategy_hint}</p>
            </AlertDescription>
        </Alert>
    );
}
