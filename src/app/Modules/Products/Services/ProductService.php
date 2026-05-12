<?php

namespace App\Modules\Products\Services;

use App\Models\Member;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductPrice;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductService
{
    public function create(User $actor, array $data): Product
    {
        $memberId = $this->assertMemberAccess($actor, (int) $data['member_id']);

        return DB::transaction(function () use ($data, $memberId, $actor): Product {
            $categoryId = $this->resolveCategoryId($memberId, $data['product_category_id'] ?? null);

            $product = Product::query()->create([
                'member_id' => $memberId,
                'product_category_id' => $categoryId,
                'code' => $data['code'],
                'name' => $data['name'],
                'invoice_text' => $data['invoice_text'] ?? null,
                'revenue_code' => $data['revenue_code'] ?? null,
                'revenue_description' => $data['revenue_description'] ?? null,
                'sales_code' => $data['sales_code'] ?? null,
                'sales_description' => $data['sales_description'] ?? null,
                'line_kind' => $data['line_kind'] ?? null,
                'sort_order' => (int) ($data['sort_order'] ?? 0),
                'is_active' => true,
            ]);

            $this->syncPricesForProduct($product, $data['prices'] ?? [], $actor);

            activity()
                ->performedOn($product)
                ->causedBy($actor)
                ->log('product.created');

            return $product->fresh(['prices.priceList', 'category']);
        });
    }

    public function update(User $actor, Product $product, array $data): Product
    {
        $memberId = $this->assertMemberAccess($actor, (int) $data['member_id'], $product->member_id);

        return DB::transaction(function () use ($product, $data, $memberId, $actor): Product {
            $categoryId = $this->resolveCategoryId($memberId, $data['product_category_id'] ?? null);

            $product->update([
                'member_id' => $memberId,
                'product_category_id' => $categoryId,
                'code' => $data['code'],
                'name' => $data['name'],
                'invoice_text' => $data['invoice_text'] ?? null,
                'revenue_code' => $data['revenue_code'] ?? null,
                'revenue_description' => $data['revenue_description'] ?? null,
                'sales_code' => $data['sales_code'] ?? null,
                'sales_description' => $data['sales_description'] ?? null,
                'line_kind' => $data['line_kind'] ?? null,
                'sort_order' => (int) ($data['sort_order'] ?? 0),
            ]);

            if (array_key_exists('prices', $data)) {
                $this->syncPricesForProduct($product, $data['prices'] ?? [], $actor);
            }

            activity()
                ->performedOn($product)
                ->causedBy($actor)
                ->log('product.updated');

            return $product->fresh(['prices.priceList', 'category']);
        });
    }

    public function delete(User $actor, Product $product): void
    {
        DB::transaction(function () use ($product, $actor): void {
            $product->prices()->delete();
            $product->delete();

            activity()
                ->performedOn($product)
                ->causedBy($actor)
                ->log('product.deleted');
        });
    }

    /**
     * @param  list<array{price_list_id: int|string, amount: numeric-string|float|int}>  $rows
     */
    protected function syncPricesForProduct(Product $product, array $rows, User $actor): void
    {
        $listIds = PriceList::query()
            ->where('member_id', $product->member_id)
            ->pluck('id')
            ->all();

        $allowed = array_flip($listIds);
        $seen = [];

        foreach ($rows as $row) {
            $lid = (int) ($row['price_list_id'] ?? 0);
            if ($lid === 0 || ! isset($allowed[$lid])) {
                throw ValidationException::withMessages([
                    'prices' => [__('Listino prezzi non valido per questo account.')],
                ]);
            }
            if (isset($seen[$lid])) {
                throw ValidationException::withMessages([
                    'prices' => [__('Listino duplicato nei prezzi.')],
                ]);
            }
            $seen[$lid] = true;

            $amount = $row['amount'] ?? null;
            if ($amount === null || $amount === '') {
                ProductPrice::query()->where('product_id', $product->id)->where('price_list_id', $lid)->delete();

                continue;
            }

            ProductPrice::query()->updateOrCreate(
                [
                    'product_id' => $product->id,
                    'price_list_id' => $lid,
                ],
                [
                    'amount' => $amount,
                ]
            );
        }

        if ($seen !== []) {
            activity()
                ->performedOn($product)
                ->causedBy($actor)
                ->withProperties(['price_lists' => array_keys($seen)])
                ->log('product.prices_synced');
        }
    }

    protected function resolveCategoryId(int $memberId, mixed $categoryId): ?int
    {
        if ($categoryId === null || $categoryId === '' || $categoryId === 0) {
            return null;
        }

        $id = (int) $categoryId;
        $exists = ProductCategory::query()->whereKey($id)->where('member_id', $memberId)->exists();
        if (! $exists) {
            throw ValidationException::withMessages([
                'product_category_id' => [__('Categoria non valida.')],
            ]);
        }

        return $id;
    }

    protected function assertMemberAccess(User $actor, int $memberId, ?int $existingMemberId = null): int
    {
        $owner = Member::query()->owners()->whereKey($memberId)->first();
        if (! $owner) {
            throw ValidationException::withMessages([
                'member_id' => [__('L\'account selezionato non è valido.')],
            ]);
        }

        if (! $actor->isAdmin() && $actor->getOwnerMember()?->id !== $owner->id) {
            throw ValidationException::withMessages([
                'member_id' => [__('Non puoi usare un account diverso dal tuo.')],
            ]);
        }

        if (! $actor->isAdmin() && $existingMemberId !== null && $existingMemberId !== $owner->id) {
            throw ValidationException::withMessages([
                'member_id' => [__('Non puoi spostare il record su un altro account.')],
            ]);
        }

        return $owner->id;
    }
}
