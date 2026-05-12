import { FormField, MemberAccountSelect, NativeSelect, StickyFormFooterActions, ToggleActiveButton } from '@/components/custom';
import { ProductChangeHistoryDialog, type ProductChangeHistoryEntry } from '@/components/domains/products/product-change-history-dialog';
import { ProductsModuleDataLayerBanner } from '@/components/domains/products/products-module-data-layer-banner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CrudModulePageLayout from '@/layouts/crud-module-page-layout';
import { moduleFormSurfaceClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type MemberOwnerOption } from '@/types';
import { router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useEffect, useRef } from 'react';
import { route } from 'ziggy-js';

interface CategoryOption {
    id: number;
    member_id: number;
    label: string;
}

interface PriceListOption {
    id: number;
    member_id: number;
    label: string;
    currency: string;
}

interface PricePayload {
    price_list_id: number;
    amount: string;
}

interface ProductEdit {
    id: number;
    member_id: number;
    is_active: boolean;
    product_category_id: number | null;
    code: string;
    name: string;
    invoice_text: string | null;
    revenue_code: string | null;
    revenue_description: string | null;
    sales_code: string | null;
    sales_description: string | null;
    line_kind: string | null;
    sort_order: number;
    prices: PricePayload[];
}

interface Props {
    product: ProductEdit;
    productChangeHistory: ProductChangeHistoryEntry[];
    productHasChangeHistory: boolean;
    memberOwners: MemberOwnerOption[];
    categoryOptions: CategoryOption[];
    priceListOptions: PriceListOption[];
    productsModuleDataLayer?: 'redis' | 'database' | null;
}

function buildPrices(
    memberId: number,
    options: PriceListOption[],
    existing: PricePayload[],
): { price_list_id: number; amount: string }[] {
    return options
        .filter((l) => l.member_id === memberId)
        .map((l) => {
            const hit = existing.find((p) => p.price_list_id === l.id);

            return { price_list_id: l.id, amount: hit ? String(hit.amount) : '' };
        });
}

export default function ProductsEdit({
    product,
    productChangeHistory,
    productHasChangeHistory,
    memberOwners,
    categoryOptions,
    priceListOptions,
    productsModuleDataLayer,
}: Props) {
    const saveRedirectMode = useRef<'stay' | 'list'>('list');

    const { data, setData, put, processing, errors, transform } = useForm({
        member_id: product.member_id,
        product_category_id: product.product_category_id ?? ('' as string | number),
        code: product.code,
        name: product.name,
        invoice_text: product.invoice_text ?? '',
        revenue_code: product.revenue_code ?? '',
        revenue_description: product.revenue_description ?? '',
        sales_code: product.sales_code ?? '',
        sales_description: product.sales_description ?? '',
        line_kind: product.line_kind ?? '',
        sort_order: product.sort_order,
        prices: buildPrices(product.member_id, priceListOptions, product.prices),
    });

    useEffect(() => {
        transform((payload) => ({
            ...payload,
            save_redirect: saveRedirectMode.current,
        }));
    }, [transform]);

    const categoriesForMember = categoryOptions.filter((c) => c.member_id === data.member_id);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Prodotti', href: route('modules.products.prodotti.index') },
        { title: 'Modifica' },
    ];

    const submitWithRedirect = (mode: 'stay' | 'list') => {
        saveRedirectMode.current = mode;
        put(route('modules.products.prodotti.update', product.id));
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        submitWithRedirect('stay');
    };

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title="Modifica prodotto"
            documentTitle={`Modifica ${product.name}`}
            processing={processing}
            stickyBar={
                <StickyFormFooterActions
                    listHref={route('modules.products.prodotti.index')}
                    disabled={processing}
                    onSaveStay={() => submitWithRedirect('stay')}
                    onSaveList={() => submitWithRedirect('list')}
                    trailingStart={
                        <>
                            {productHasChangeHistory ? (
                                <ProductChangeHistoryDialog entries={productChangeHistory} disabled={processing} />
                            ) : null}
                            <ToggleActiveButton
                                isActive={product.is_active}
                                disabled={processing}
                                onClick={() =>
                                    router.post(route('modules.products.prodotti.toggle-active', product.id))
                                }
                            />
                        </>
                    }
                />
            }
        >
            <ProductsModuleDataLayerBanner layer={productsModuleDataLayer} />
            <form id="prodotti-edit-form" onSubmit={submit} className={moduleFormSurfaceClassName()}>
                <MemberAccountSelect
                    options={memberOwners}
                    value={data.member_id}
                    onValueChange={(mid) =>
                        setData({
                            ...data,
                            member_id: mid,
                            product_category_id: '',
                            prices: buildPrices(mid, priceListOptions, data.prices),
                        })
                    }
                    error={errors.member_id}
                />

                <FormField id="product_category_id" label="Categoria (opzionale)" error={errors.product_category_id}>
                    <NativeSelect
                        id="product_category_id"
                        value={data.product_category_id === '' ? '' : String(data.product_category_id)}
                        onChange={(e) =>
                            setData('product_category_id', e.target.value === '' ? '' : Number(e.target.value))
                        }
                    >
                        <option value="">— Nessuna —</option>
                        {categoriesForMember.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.label}
                            </option>
                        ))}
                    </NativeSelect>
                </FormField>

                <FormField id="code" label="Codice" required error={errors.code}>
                    <Input id="code" value={data.code} onChange={(e) => setData('code', e.target.value)} required />
                </FormField>

                <FormField id="name" label="Nome" required error={errors.name}>
                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                </FormField>

                <FormField id="invoice_text" label="Testo in fattura" error={errors.invoice_text}>
                    <Textarea
                        id="invoice_text"
                        value={data.invoice_text}
                        onChange={(e) => setData('invoice_text', e.target.value)}
                        rows={2}
                    />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField id="revenue_code" label="Codice ricavo" error={errors.revenue_code}>
                        <Input id="revenue_code" value={data.revenue_code} onChange={(e) => setData('revenue_code', e.target.value)} />
                    </FormField>
                    <FormField id="sales_code" label="Codice vendita" error={errors.sales_code}>
                        <Input id="sales_code" value={data.sales_code} onChange={(e) => setData('sales_code', e.target.value)} />
                    </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField id="revenue_description" label="Descrizione ricavo" error={errors.revenue_description}>
                        <Textarea
                            id="revenue_description"
                            value={data.revenue_description}
                            onChange={(e) => setData('revenue_description', e.target.value)}
                            rows={2}
                        />
                    </FormField>
                    <FormField id="sales_description" label="Descrizione vendita" error={errors.sales_description}>
                        <Textarea
                            id="sales_description"
                            value={data.sales_description}
                            onChange={(e) => setData('sales_description', e.target.value)}
                            rows={2}
                        />
                    </FormField>
                </div>

                <FormField id="line_kind" label="Tipo riga" error={errors.line_kind}>
                    <NativeSelect id="line_kind" value={data.line_kind} onChange={(e) => setData('line_kind', e.target.value)}>
                        <option value="">—</option>
                        <option value="revenue">Ricavo</option>
                        <option value="sales">Vendita</option>
                        <option value="other">Altro</option>
                    </NativeSelect>
                </FormField>

                <FormField id="sort_order" label="Ordine" error={errors.sort_order}>
                    <Input
                        id="sort_order"
                        type="number"
                        min={0}
                        value={data.sort_order}
                        onChange={(e) => setData('sort_order', Number(e.target.value))}
                    />
                </FormField>

                <div className="grid gap-3">
                    <Label>Prezzi per listino</Label>
                    {data.prices.map((row, idx) => {
                        const meta = priceListOptions.find((l) => l.id === row.price_list_id);
                        return (
                            <div key={row.price_list_id} className="flex flex-wrap items-end gap-2">
                                <div className="min-w-[180px] flex-1 text-sm">
                                    <span className="text-muted-foreground">{meta?.label}</span>
                                    <span className="text-muted-foreground text-xs"> ({meta?.currency})</span>
                                </div>
                                <Input
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    className="w-40"
                                    value={row.amount}
                                    onChange={(e) => {
                                        const next = [...data.prices];
                                        next[idx] = { ...next[idx], amount: e.target.value };
                                        setData('prices', next);
                                    }}
                                />
                            </div>
                        );
                    })}
                    {errors.prices ? <p className="text-destructive text-sm">{String(errors.prices)}</p> : null}
                </div>
            </form>
        </CrudModulePageLayout>
    );
}
