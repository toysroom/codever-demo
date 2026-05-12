import { Button } from '@/components/ui/button';
import { StickyReadFooterActions } from '@/components/custom';
import CrudModulePageLayout from '@/layouts/crud-module-page-layout';
import { entityReadonlyCardClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

interface PriceRow {
    price_list_id: number;
    list_name?: string | null;
    currency?: string | null;
    amount: string;
}

interface ProductShow {
    id: number;
    member_label: string | null;
    product_category_id: number | null;
    category_label: string | null;
    code: string;
    name: string;
    invoice_text: string | null;
    revenue_code: string | null;
    revenue_description: string | null;
    sales_code: string | null;
    sales_description: string | null;
    line_kind: string | null;
    sort_order: number;
    prices: PriceRow[];
}

interface Props {
    product: ProductShow;
}

export default function ProductsShow({ product }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Prodotti', href: route('modules.products.prodotti.index') },
        { title: product.name },
    ];

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title={product.name}
            documentTitle={product.name}
            stickyBar={
                <StickyReadFooterActions listHref={route('modules.products.prodotti.index')}>
                    <Button asChild>
                        <Link href={route('modules.products.prodotti.edit', product.id)}>Modifica</Link>
                    </Button>
                </StickyReadFooterActions>
            }
        >
            <dl className={entityReadonlyCardClassName('grid w-full gap-3 p-6 text-sm')}>
                {product.member_label ? (
                    <>
                        <dt className="text-muted-foreground">Account</dt>
                        <dd className="font-medium">{product.member_label}</dd>
                    </>
                ) : null}
                <dt className="text-muted-foreground">Codice</dt>
                <dd className="font-mono">{product.code}</dd>
                <dt className="text-muted-foreground">Categoria</dt>
                <dd>{product.category_label ?? '—'}</dd>
                <dt className="text-muted-foreground">Testo in fattura</dt>
                <dd className="whitespace-pre-wrap">{product.invoice_text ?? '—'}</dd>
                <dt className="text-muted-foreground">Tipo riga</dt>
                <dd>{product.line_kind ?? '—'}</dd>
                <dt className="text-muted-foreground">Ordine</dt>
                <dd>{product.sort_order}</dd>
                <dt className="text-muted-foreground">Ricavo</dt>
                <dd>
                    {product.revenue_code ?? '—'} — {product.revenue_description ?? ''}
                </dd>
                <dt className="text-muted-foreground">Vendita</dt>
                <dd>
                    {product.sales_code ?? '—'} — {product.sales_description ?? ''}
                </dd>
            </dl>
            <div className={entityReadonlyCardClassName('mt-6 w-full p-6')}>
                <h2 className="mb-3 font-medium">Prezzi</h2>
                {product.prices.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Nessun prezzo impostato.</p>
                ) : (
                    <table className="w-full text-sm">
                        <tbody>
                            {product.prices.map((p) => (
                                <tr key={p.price_list_id} className="border-b border-sidebar-border/40">
                                    <td className="py-2">{p.list_name ?? '#'}</td>
                                    <td className="py-2 text-right">
                                        {p.amount} {p.currency}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </CrudModulePageLayout>
    );
}
