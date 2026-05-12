<?php

namespace App\Modules\Products\Services;

use App\Models\Member;
use App\Models\PriceList;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PriceListService
{
    public function create(User $actor, array $data): PriceList
    {
        $memberId = $this->assertMemberAccess($actor, (int) $data['member_id']);

        return DB::transaction(function () use ($data, $memberId, $actor): PriceList {
            if (! empty($data['is_default'])) {
                $this->clearDefaultForMember($memberId);
            }

            $list = PriceList::query()->create([
                'member_id' => $memberId,
                'name' => $data['name'],
                'code' => $data['code'] ?? null,
                'currency' => $data['currency'] ?? 'EUR',
                'valid_from' => $data['valid_from'] ?? null,
                'valid_to' => $data['valid_to'] ?? null,
                'is_default' => (bool) ($data['is_default'] ?? false),
                'notes' => $data['notes'] ?? null,
                'is_active' => true,
            ]);

            activity()
                ->performedOn($list)
                ->causedBy($actor)
                ->log('price_list.created');

            return $list;
        });
    }

    public function update(User $actor, PriceList $priceList, array $data): PriceList
    {
        $memberId = $this->assertMemberAccess($actor, (int) $data['member_id'], $priceList->member_id);

        return DB::transaction(function () use ($priceList, $data, $memberId, $actor): PriceList {
            if (! empty($data['is_default'])) {
                $this->clearDefaultForMember($memberId, exceptId: $priceList->id);
            }

            $priceList->update([
                'member_id' => $memberId,
                'name' => $data['name'],
                'code' => $data['code'] ?? null,
                'currency' => $data['currency'] ?? 'EUR',
                'valid_from' => $data['valid_from'] ?? null,
                'valid_to' => $data['valid_to'] ?? null,
                'is_default' => (bool) ($data['is_default'] ?? false),
                'notes' => $data['notes'] ?? null,
            ]);

            activity()
                ->performedOn($priceList)
                ->causedBy($actor)
                ->log('price_list.updated');

            return $priceList->fresh();
        });
    }

    public function delete(User $actor, PriceList $priceList): void
    {
        DB::transaction(function () use ($priceList, $actor): void {
            $priceList->delete();

            activity()
                ->performedOn($priceList)
                ->causedBy($actor)
                ->log('price_list.deleted');
        });
    }

    protected function clearDefaultForMember(int $memberId, ?int $exceptId = null): void
    {
        $q = PriceList::withoutGlobalScopes()->where('member_id', $memberId)->where('is_default', true);
        if ($exceptId) {
            $q->whereKeyNot($exceptId);
        }
        $q->update(['is_default' => false]);
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
