<?php

declare(strict_types=1);

namespace App\Modules\Products\Support;

use App\Models\Member;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductPrice;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Spatie\Activitylog\Models\Activity;

final class ProductActivityHistoryPresenter
{
    /** @var array<string, string> */
    private const PRODUCT_FIELD_LABELS = [
        'member_id' => 'Account',
        'product_category_id' => 'Categoria',
        'code' => 'Codice',
        'name' => 'Nome',
        'invoice_text' => 'Testo in fattura',
        'revenue_code' => 'Codice ricavo',
        'revenue_description' => 'Descrizione ricavo',
        'sales_code' => 'Codice vendita',
        'sales_description' => 'Descrizione vendita',
        'line_kind' => 'Tipo riga',
        'sort_order' => 'Ordine',
        'is_active' => 'Stato',
    ];

    /** @var array<string, string> */
    private const PRICE_FIELD_LABELS = [
        'amount' => 'Importo',
        'price_list_id' => 'Listino',
    ];

    /**
     * @return list<array{
     *     id: int,
     *     occurred_at: string,
     *     summary: string,
     *     actor: string|null,
     *     changes: list<array{label: string, before: string|null, after: string|null}>
     * }>
     */
    public static function forProduct(Product $product, int $limit = 100): array
    {
        $priceRowIds = ProductPrice::withTrashed()
            ->where('product_id', $product->id)
            ->pluck('id')
            ->all();

        $activities = Activity::query()
            ->where(function ($outer) use ($product, $priceRowIds): void {
                $outer->where(function ($q) use ($product): void {
                    $q->where('subject_type', Product::class)
                        ->where('subject_id', $product->id);
                });
                if ($priceRowIds !== []) {
                    $outer->orWhere(function ($q) use ($priceRowIds): void {
                        $q->where('subject_type', ProductPrice::class)
                            ->whereIn('subject_id', $priceRowIds);
                    });
                }
            })
            ->with(['causer' => fn ($cq) => $cq->select('id', 'name', 'email')])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();

        [$categoryLabels, $memberLabels, $priceListLabels] = self::collectReferenceLabels($activities);

        return $activities
            ->map(function (Activity $activity) use ($categoryLabels, $memberLabels, $priceListLabels): array {
                return [
                    'id' => (int) $activity->id,
                    'occurred_at' => $activity->created_at instanceof CarbonInterface
                        ? $activity->created_at->toIso8601String()
                        : (string) $activity->created_at,
                    'summary' => self::summarize($activity),
                    'actor' => self::actorLabel($activity->causer),
                    'changes' => self::mapChanges($activity, $categoryLabels, $memberLabels, $priceListLabels),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, Activity>  $activities
     * @return array{0: array<int, string>, 1: array<int, string>, 2: array<int, string>}
     */
    private static function collectReferenceLabels(Collection $activities): array
    {
        $categoryIds = [];
        $memberIds = [];
        $priceListIds = [];

        foreach ($activities as $activity) {
            $props = self::propsArray($activity);
            $attrs = is_array($props['attributes'] ?? null) ? $props['attributes'] : [];
            $old = is_array($props['old'] ?? null) ? $props['old'] : [];
            foreach ([$attrs, $old] as $bag) {
                foreach ($bag as $k => $v) {
                    if ($k === 'product_category_id' && $v !== null && $v !== '') {
                        $categoryIds[] = (int) $v;
                    }
                    if ($k === 'member_id' && $v !== null && $v !== '') {
                        $memberIds[] = (int) $v;
                    }
                    if ($k === 'price_list_id' && $v !== null && $v !== '') {
                        $priceListIds[] = (int) $v;
                    }
                }
            }
        }

        $categoryIds = array_values(array_unique(array_filter($categoryIds)));
        $memberIds = array_values(array_unique(array_filter($memberIds)));
        $priceListIds = array_values(array_unique(array_filter($priceListIds)));

        $categoryLabels = $categoryIds === [] ? [] : ProductCategory::query()
            ->whereIn('id', $categoryIds)
            ->get(['id', 'name'])
            ->mapWithKeys(fn (ProductCategory $c): array => [(int) $c->id => (string) $c->name])
            ->all();

        $memberLabels = $memberIds === [] ? [] : Member::query()
            ->whereIn('id', $memberIds)
            ->get(['id', 'company_name', 'first_name', 'last_name'])
            ->mapWithKeys(function (Member $m): array {
                $label = (string) ($m->company_name ?: trim(($m->first_name ?? '').' '.($m->last_name ?? '')) ?: ('#'.$m->id));

                return [(int) $m->id => $label];
            })
            ->all();

        $priceListLabels = $priceListIds === [] ? [] : PriceList::query()
            ->whereIn('id', $priceListIds)
            ->get(['id', 'name'])
            ->mapWithKeys(fn (PriceList $pl): array => [(int) $pl->id => (string) $pl->name])
            ->all();

        return [$categoryLabels, $memberLabels, $priceListLabels];
    }

    /**
     * @return array<string, mixed>
     */
    private static function propsArray(Activity $activity): array
    {
        $p = $activity->properties;
        if ($p instanceof Collection) {
            return $p->toArray();
        }

        return is_array($p) ? $p : [];
    }

    private static function summarize(Activity $activity): string
    {
        $description = (string) $activity->description;
        $event = (string) ($activity->event ?? '');

        if ($activity->subject_type === ProductPrice::class) {
            return match ($event) {
                'created' => 'Prezzo listino: creazione',
                'updated' => 'Prezzo listino: modifica',
                'deleted' => 'Prezzo listino: rimozione',
                default => $description !== '' ? $description : 'Prezzo listino',
            };
        }

        return match ($event) {
            'created' => 'Prodotto creato',
            'updated' => 'Prodotto modificato',
            'deleted' => 'Prodotto eliminato',
            default => match ($description) {
                'product.deleted' => 'Prodotto eliminato',
                default => $description !== '' ? $description : 'Attività',
            },
        };
    }

    private static function actorLabel(?Model $causer): ?string
    {
        if ($causer === null) {
            return null;
        }

        $name = trim((string) ($causer->getAttribute('name') ?? ''));
        if ($name !== '') {
            return $name;
        }

        $email = (string) ($causer->getAttribute('email') ?? '');

        return $email !== '' ? $email : null;
    }

    /**
     * @param  array<int, string>  $categoryLabels
     * @param  array<int, string>  $memberLabels
     * @param  array<int, string>  $priceListLabels
     * @return list<array{label: string, before: string|null, after: string|null}>
     */
    private static function mapChanges(
        Activity $activity,
        array $categoryLabels,
        array $memberLabels,
        array $priceListLabels,
    ): array {
        $props = self::propsArray($activity);
        $attrs = is_array($props['attributes'] ?? null) ? $props['attributes'] : [];
        $old = is_array($props['old'] ?? null) ? $props['old'] : [];

        $isProduct = $activity->subject_type === Product::class;
        $isPrice = $activity->subject_type === ProductPrice::class;
        $labelsMap = $isProduct ? self::PRODUCT_FIELD_LABELS : ($isPrice ? self::PRICE_FIELD_LABELS : []);

        $out = [];
        foreach ($attrs as $key => $afterRaw) {
            if (! is_string($key)) {
                continue;
            }
            $beforeRaw = array_key_exists($key, $old) ? $old[$key] : null;
            if (self::valuesEqual($beforeRaw, $afterRaw)) {
                continue;
            }

            $label = $labelsMap[$key] ?? $key;
            $out[] = [
                'label' => $label,
                'before' => self::formatFieldValue($key, $beforeRaw, $categoryLabels, $memberLabels, $priceListLabels),
                'after' => self::formatFieldValue($key, $afterRaw, $categoryLabels, $memberLabels, $priceListLabels),
            ];
        }

        return $out;
    }

    private static function valuesEqual(mixed $a, mixed $b): bool
    {
        if ($a === $b) {
            return true;
        }

        return (string) $a === (string) $b;
    }

    /**
     * @param  array<int, string>  $categoryLabels
     * @param  array<int, string>  $memberLabels
     * @param  array<int, string>  $priceListLabels
     */
    private static function formatFieldValue(
        string $key,
        mixed $value,
        array $categoryLabels,
        array $memberLabels,
        array $priceListLabels,
    ): ?string {
        if ($value === null || $value === '') {
            return '—';
        }

        if ($key === 'is_active') {
            return filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 'Attivo' : 'Disattivo';
        }

        if ($key === 'line_kind') {
            return match ((string) $value) {
                'revenue' => 'Ricavo',
                'sales' => 'Vendita',
                'other' => 'Altro',
                default => (string) $value,
            };
        }

        if ($key === 'product_category_id') {
            $id = (int) $value;

            return $categoryLabels[$id] ?? ('#'.$id);
        }

        if ($key === 'member_id') {
            $id = (int) $value;

            return $memberLabels[$id] ?? ('#'.$id);
        }

        if ($key === 'price_list_id') {
            $id = (int) $value;

            return $priceListLabels[$id] ?? ('#'.$id);
        }

        if ($key === 'amount') {
            return is_numeric($value) ? (string) $value : (string) $value;
        }

        if (is_array($value)) {
            return json_encode($value, JSON_UNESCAPED_UNICODE);
        }

        return (string) $value;
    }

    /**
     * @param  array<int>  $productIds
     * @return array<int, true> product_id => true quando esiste almeno una modifica dopo la creazione (o attività sui prezzi)
     */
    public static function productIdsHavingHistorySet(array $productIds): array
    {
        $productIds = array_values(array_unique(array_filter(array_map('intval', $productIds))));
        if ($productIds === []) {
            return [];
        }

        $eventsByProductId = Activity::query()
            ->where('subject_type', Product::class)
            ->whereIn('subject_id', $productIds)
            ->get(['subject_id', 'event'])
            ->groupBy('subject_id')
            ->map(fn (Collection $group): array => $group->pluck('event')->all());

        $priceRows = ProductPrice::withTrashed()
            ->whereIn('product_id', $productIds)
            ->get(['id', 'product_id']);

        $priceIdToProductId = $priceRows->keyBy('id')->map(fn (ProductPrice $r): int => (int) $r->product_id);
        $allPriceIds = $priceRows->pluck('id')->all();

        $productIdsWithPriceRowActivity = [];
        if ($allPriceIds !== []) {
            $hitPriceIds = Activity::query()
                ->where('subject_type', ProductPrice::class)
                ->whereIn('subject_id', $allPriceIds)
                ->distinct()
                ->pluck('subject_id');

            foreach ($hitPriceIds as $priceRowId) {
                $pid = $priceIdToProductId->get((int) $priceRowId);
                if ($pid !== null) {
                    $productIdsWithPriceRowActivity[$pid] = true;
                }
            }
        }

        $set = [];
        foreach ($productIds as $pid) {
            if (isset($productIdsWithPriceRowActivity[$pid])) {
                $set[$pid] = true;

                continue;
            }

            /** @var list<string|null> $events */
            $events = $eventsByProductId->get($pid)
                ?? $eventsByProductId->get((string) $pid)
                ?? [];
            $n = count($events);
            if ($n >= 2) {
                $set[$pid] = true;

                continue;
            }
            if ($n === 1 && $events[0] !== 'created') {
                $set[$pid] = true;
            }
        }

        return $set;
    }

    public static function shouldShowChangeHistoryIcon(int $productId): bool
    {
        return isset(self::productIdsHavingHistorySet([$productId])[$productId]);
    }
}
