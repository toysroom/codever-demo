<?php

namespace App\Modules\Products\Caching;

use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductPrice;

final class ProductsCatalogCacheInvalidator
{
    public function __construct(
        protected ProductsCatalogCache $cache
    ) {}

    public function afterProductSavedOrDeleted(Product $product): void
    {
        $scopes = $this->memberScopes($product->member_id, $product);
        $this->cache->bumpListGenerations(ProductsCatalogCache::ENTITY_PRODUCTS, $scopes);
        $this->cache->forgetShow(ProductsCatalogCache::ENTITY_PRODUCTS, $product->id);
    }

    public function afterProductCategorySavedOrDeleted(ProductCategory $category): void
    {
        $scopes = $this->memberScopes($category->member_id, $category);
        $this->cache->bumpListGenerations(ProductsCatalogCache::ENTITY_CATEGORIES, $scopes);
        $this->cache->bumpListGenerations(ProductsCatalogCache::ENTITY_PRODUCTS, $scopes);
        $this->cache->forgetShow(ProductsCatalogCache::ENTITY_CATEGORIES, $category->id);
    }

    public function afterPriceListSavedOrDeleted(PriceList $list): void
    {
        $scopes = $this->memberScopes($list->member_id, $list);
        $this->cache->bumpListGenerations(ProductsCatalogCache::ENTITY_PRICE_LISTS, $scopes);
        $this->cache->bumpListGenerations(ProductsCatalogCache::ENTITY_PRODUCTS, $scopes);
        $this->cache->forgetShow(ProductsCatalogCache::ENTITY_PRICE_LISTS, $list->id);
    }

    public function afterProductPriceSavedOrDeleted(ProductPrice $row): void
    {
        $row->loadMissing('product');
        $productId = $row->product_id;
        $memberId = $row->product?->member_id;
        if ($memberId === null && $productId > 0) {
            $memberId = Product::query()->whereKey($productId)->value('member_id');
        }
        if ($memberId === null) {
            return;
        }
        $scopes = ProductsCatalogCache::scopesForMember((int) $memberId);
        $this->cache->bumpListGenerations(ProductsCatalogCache::ENTITY_PRODUCTS, $scopes);
        $this->cache->forgetShow(ProductsCatalogCache::ENTITY_PRODUCTS, $productId);
    }

    /**
     * @return list<string>
     */
    private function memberScopes(int $memberId, Product|ProductCategory|PriceList $model): array
    {
        $scopes = ProductsCatalogCache::scopesForMember($memberId);
        if ($model->exists && $model->wasChanged('member_id')) {
            $original = (int) $model->getOriginal('member_id');
            if ($original > 0) {
                $scopes = array_merge($scopes, ProductsCatalogCache::scopesForMember($original));
            }
        }

        return array_values(array_unique($scopes));
    }
}
