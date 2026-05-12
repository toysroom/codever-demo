<?php

namespace App\Modules\Products\Services;

use App\Models\Member;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductCategoryService
{
    public function create(User $actor, array $data): ProductCategory
    {
        $memberId = $this->assertMemberAccess($actor, (int) $data['member_id']);
        $parentId = $this->normalizeParentId($memberId, isset($data['parent_id']) ? (int) $data['parent_id'] : null);

        return DB::transaction(function () use ($data, $memberId, $parentId, $actor): ProductCategory {
            $category = ProductCategory::query()->create([
                'member_id' => $memberId,
                'parent_id' => $parentId,
                'name' => $data['name'],
                'sort_order' => (int) ($data['sort_order'] ?? 0),
                'is_active' => true,
            ]);

            activity()
                ->performedOn($category)
                ->causedBy($actor)
                ->log('product_category.created');

            return $category;
        });
    }

    public function update(User $actor, ProductCategory $category, array $data): ProductCategory
    {
        $memberId = $this->assertMemberAccess($actor, (int) $data['member_id'], $category->member_id);
        $parentId = $this->normalizeParentId($memberId, isset($data['parent_id']) ? (int) $data['parent_id'] : null, $category->id);

        return DB::transaction(function () use ($category, $data, $memberId, $parentId, $actor): ProductCategory {
            $category->update([
                'member_id' => $memberId,
                'parent_id' => $parentId,
                'name' => $data['name'],
                'sort_order' => (int) ($data['sort_order'] ?? 0),
            ]);

            activity()
                ->performedOn($category)
                ->causedBy($actor)
                ->log('product_category.updated');

            return $category->fresh();
        });
    }

    public function delete(User $actor, ProductCategory $category): void
    {
        DB::transaction(function () use ($category, $actor): void {
            ProductCategory::query()->where('parent_id', $category->id)->update(['parent_id' => null]);
            $category->delete();

            activity()
                ->performedOn($category)
                ->causedBy($actor)
                ->log('product_category.deleted');
        });
    }

    protected function normalizeParentId(int $memberId, ?int $parentId, ?int $ignoreCircularId = null): ?int
    {
        if ($parentId === null || $parentId === 0) {
            return null;
        }

        if ($ignoreCircularId !== null && $parentId === $ignoreCircularId) {
            throw ValidationException::withMessages([
                'parent_id' => [__('La categoria non può essere padre di se stessa.')],
            ]);
        }

        $parent = ProductCategory::query()->whereKey($parentId)->where('member_id', $memberId)->first();
        if (! $parent) {
            throw ValidationException::withMessages([
                'parent_id' => [__('Categoria padre non valida.')],
            ]);
        }

        return $parent->id;
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
