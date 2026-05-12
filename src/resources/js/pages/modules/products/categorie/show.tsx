import { Button } from '@/components/ui/button';
import { StickyReadFooterActions } from '@/components/custom';
import CrudModulePageLayout from '@/layouts/crud-module-page-layout';
import { entityReadonlyCardClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

interface CategoryShow {
    id: number;
    member_label: string | null;
    parent_label: string | null;
    name: string;
    sort_order: number;
}

interface Props {
    category: CategoryShow;
}

export default function CategoriesShow({ category }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Categorie', href: route('modules.products.categorie.index') },
        { title: category.name },
    ];

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title={category.name}
            documentTitle={category.name}
            stickyBar={
                <StickyReadFooterActions listHref={route('modules.products.categorie.index')}>
                    <Button asChild>
                        <Link href={route('modules.products.categorie.edit', category.id)}>Modifica</Link>
                    </Button>
                </StickyReadFooterActions>
            }
        >
            <dl className={entityReadonlyCardClassName('grid w-full gap-3 p-6 text-sm')}>
                {category.member_label ? (
                    <>
                        <dt className="text-muted-foreground">Account</dt>
                        <dd className="font-medium">{category.member_label}</dd>
                    </>
                ) : null}
                <dt className="text-muted-foreground">Padre</dt>
                <dd>{category.parent_label ?? '—'}</dd>
                <dt className="text-muted-foreground">Ordine</dt>
                <dd>{category.sort_order}</dd>
            </dl>
        </CrudModulePageLayout>
    );
}
