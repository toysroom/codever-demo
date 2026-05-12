import { FormField, MemberAccountSelect, NativeSelect, StickyReadFooterActions } from '@/components/custom';
import { ProductsModuleDataLayerBanner } from '@/components/domains/products/products-module-data-layer-banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CrudModulePageLayout from '@/layouts/crud-module-page-layout';
import { moduleFormSurfaceClassName } from '@/lib/module-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type MemberOwnerOption } from '@/types';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
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

interface Props {
    memberOwners: MemberOwnerOption[];
    categoryOptions: CategoryOption[];
    priceListOptions: PriceListOption[];
    productsModuleDataLayer?: 'redis' | 'database' | null;
}

function buildPrices(memberId: number, options: PriceListOption[]) {
    return options
        .filter((l) => l.member_id === memberId)
        .map((l) => ({ price_list_id: l.id, amount: '' }));
}

export default function ProductsCreate({
    memberOwners,
    categoryOptions,
    priceListOptions,
    productsModuleDataLayer,
}: Props) {
    const m0 = memberOwners[0]?.id ?? 0;

    const { data, setData, post, processing, errors } = useForm({
        member_id: m0,
        product_category_id: '' as string | number,
        code: '',
        name: '',
        invoice_text: '',
        revenue_code: '',
        revenue_description: '',
        sales_code: '',
        sales_description: '',
        line_kind: '',
        sort_order: 0,
        prices: buildPrices(m0, priceListOptions),
    });

    const categoriesForMember = categoryOptions.filter((c) => c.member_id === data.member_id);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Prodotti', href: route('modules.products.prodotti.index') },
        { title: 'Nuovo' },
    ];

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('modules.products.prodotti.store'));
    };

    return (
        <CrudModulePageLayout
            breadcrumbs={breadcrumbs}
            title="Nuovo prodotto"
            documentTitle="Nuovo prodotto"
            processing={processing}
            stickyBar={
                <StickyReadFooterActions listHref={route('modules.products.prodotti.index')}>
                    <Button type="submit" form="prodotti-create-form" disabled={processing}>
                        {processing ? 'Salvataggio…' : 'Salva'}
                    </Button>
                </StickyReadFooterActions>
            }
        >
            <ProductsModuleDataLayerBanner layer={productsModuleDataLayer} />
            <form id="prodotti-create-form" onSubmit={submit} className={moduleFormSurfaceClassName()}>
                <MemberAccountSelect
                    options={memberOwners}
                    value={data.member_id}
                    onValueChange={(mid) =>
                        setData({
                            ...data,
                            member_id: mid,
                            product_category_id: '',
                            prices: buildPrices(mid, priceListOptions),
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
                    {data.prices.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            Nessun listino per questo account: creane uno nella sezione Listini.
                        </p>
                    ) : (
                        data.prices.map((row, idx) => {
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
                                        placeholder="0"
                                    />
                                </div>
                            );
                        })
                    )}
                    {errors.prices ? <p className="text-destructive text-sm">{String(errors.prices)}</p> : null}
                </div>
            </form>
        </CrudModulePageLayout>
    );
}
