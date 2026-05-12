<?php

namespace App\Modules\Customers\Services;

use App\Models\Customer;
use App\Models\CustomerCrmNote;
use App\Models\CustomerType;
use App\Models\Member;
use App\Models\Role;
use App\Models\User;
use App\Modules\Customers\Contracts\CustomerRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class CustomerService
{
    public function __construct(
        protected CustomerRepositoryInterface $customers
    ) {}

    public function create(User $actor, array $data): Customer
    {
        $memberId = (int) $data['member_id'];
        $owner = Member::query()->owners()->whereKey($memberId)->first();
        if (! $owner) {
            throw ValidationException::withMessages([
                'member_id' => [__('L\'account selezionato non è valido.')],
            ]);
        }

        if (! $actor->isAdmin() && $actor->getOwnerMember()?->id !== $owner->id) {
            throw ValidationException::withMessages([
                'member_id' => [__('Non puoi creare clienti per un altro account.')],
            ]);
        }

        $this->assertUnderCustomerLimit($owner);

        return DB::transaction(function () use ($data, $owner, $actor) {
            $name = trim($data['first_name'].' '.$data['last_name']);

            $user = User::query()->create([
                'name' => $name,
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'user_type' => 'customer',
                'is_active' => true,
                'email_verified_at' => ! empty($data['mark_email_verified']) ? now() : null,
            ]);

            $role = Role::query()->where('name', 'customer')->first();
            if ($role) {
                $user->assignRole($role);
            }

            $customer = Customer::query()->create([
                'user_id' => $user->id,
                'member_id' => $owner->id,
                'external_code' => $data['external_code'] ?? null,
                'company_name' => $data['company_name'] ?? null,
                'reference_person' => $data['reference_person'] ?? null,
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'vat_number' => $data['vat_number'] ?? null,
                'fiscal_code' => $data['fiscal_code'] ?? null,
                'phone' => $data['phone'] ?? null,
                'mobile_phone' => $data['mobile_phone'] ?? null,
                'fax' => $data['fax'] ?? null,
                'contact_email' => $data['contact_email'] ?? null,
                'pec' => $data['pec'] ?? null,
                'sdi_recipient_code' => $data['sdi_recipient_code'] ?? null,
                'website' => $data['website'] ?? null,
                'notes' => $data['notes'] ?? null,
                'entity_type' => $data['entity_type'] ?? null,
                'bank_name' => $data['bank_name'] ?? null,
                'iban' => $data['iban'] ?? null,
                'address' => $data['address'] ?? null,
                'street' => $data['street'] ?? null,
                'city' => $data['city'] ?? null,
                'postal_code' => $data['postal_code'] ?? null,
                'province' => $data['province'] ?? null,
                'country' => $data['country'] ?? null,
                'custom_fields' => $data['custom_fields'] ?? null,
                'is_active' => true,
            ]);

            $this->syncContacts($customer, $data['contacts'] ?? []);
            $this->maybeCreateCrmNote($customer, $actor, $data['new_crm_note'] ?? null);
            $this->syncCustomerTypes($customer, $data['customer_type_ids'] ?? []);

            return $customer->fresh(['user', 'member', 'contacts', 'crmNotes.author', 'customerTypes']);
        });
    }

    public function update(User $actor, Customer $customer, array $data): Customer
    {
        if (! $actor->isAdmin() && $actor->getOwnerMember()?->id !== $customer->member_id) {
            throw ValidationException::withMessages([
                'member_id' => [__('Operazione non consentita.')],
            ]);
        }

        $targetMemberId = $actor->isAdmin()
            ? (int) $data['member_id']
            : (int) $customer->member_id;

        $owner = Member::query()->owners()->whereKey($targetMemberId)->first();
        if (! $owner) {
            throw ValidationException::withMessages([
                'member_id' => [__('L\'account selezionato non è valido.')],
            ]);
        }

        if (! $actor->isAdmin() && $targetMemberId !== $customer->member_id) {
            throw ValidationException::withMessages([
                'member_id' => [__('Non puoi spostare il cliente su un altro account.')],
            ]);
        }

        if ($targetMemberId !== $customer->member_id) {
            $this->assertUnderCustomerLimit($owner, ignoreCustomerId: $customer->id);
        }

        return DB::transaction(function () use ($customer, $data, $owner, $actor) {
            $name = trim($data['first_name'].' '.$data['last_name']);
            $customer->user->update([
                'name' => $name,
                'email' => $data['email'],
            ]);
            if (! empty($data['password'])) {
                $customer->user->update([
                    'password' => Hash::make($data['password']),
                ]);
            }

            $customer->update([
                'member_id' => $owner->id,
                'external_code' => $data['external_code'] ?? null,
                'company_name' => $data['company_name'] ?? null,
                'reference_person' => $data['reference_person'] ?? null,
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'vat_number' => $data['vat_number'] ?? null,
                'fiscal_code' => $data['fiscal_code'] ?? null,
                'phone' => $data['phone'] ?? null,
                'mobile_phone' => $data['mobile_phone'] ?? null,
                'fax' => $data['fax'] ?? null,
                'contact_email' => $data['contact_email'] ?? null,
                'pec' => $data['pec'] ?? null,
                'sdi_recipient_code' => $data['sdi_recipient_code'] ?? null,
                'website' => $data['website'] ?? null,
                'notes' => $data['notes'] ?? null,
                'entity_type' => $data['entity_type'] ?? null,
                'bank_name' => $data['bank_name'] ?? null,
                'iban' => $data['iban'] ?? null,
                'address' => $data['address'] ?? null,
                'street' => $data['street'] ?? null,
                'city' => $data['city'] ?? null,
                'postal_code' => $data['postal_code'] ?? null,
                'province' => $data['province'] ?? null,
                'country' => $data['country'] ?? null,
                'custom_fields' => $data['custom_fields'] ?? null,
            ]);

            if (array_key_exists('contacts', $data)) {
                $this->syncContacts($customer, $data['contacts'] ?? []);
            }

            if (array_key_exists('new_crm_note', $data)) {
                $this->maybeCreateCrmNote($customer, $actor, $data['new_crm_note']);
            }

            if (array_key_exists('customer_type_ids', $data)) {
                $this->syncCustomerTypes($customer, $data['customer_type_ids']);
            }

            return $customer->fresh(['user', 'member', 'contacts', 'crmNotes.author', 'customerTypes']);
        });
    }

    public function delete(Customer $customer): void
    {
        DB::transaction(function () use ($customer) {
            $customer->delete();
            $customer->user?->delete();
        });
    }

    protected function syncCustomerTypes(Customer $customer, mixed $rawIds): void
    {
        if (! is_array($rawIds)) {
            $customer->customerTypes()->detach();

            return;
        }

        $ids = collect($rawIds)
            ->filter(fn ($id) => $id !== null && $id !== '')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $allowed = CustomerType::query()
            ->where('member_id', $customer->member_id)
            ->whereIn('id', $ids)
            ->pluck('id')
            ->all();

        $customer->customerTypes()->sync($allowed);
    }

    /**
     * @param  list<array{type?: string, label?: string|null, value?: string|null}>  $contacts
     */
    protected function syncContacts(Customer $customer, array $contacts): void
    {
        $customer->contacts()->delete();
        foreach (array_values($contacts) as $index => $row) {
            $value = isset($row['value']) ? trim((string) $row['value']) : '';
            if ($value === '') {
                continue;
            }
            $customer->contacts()->create([
                'type' => $row['type'] ?? 'other',
                'label' => $row['label'] ?? null,
                'value' => $value,
                'sort_order' => $index,
            ]);
        }
    }

    /**
     * @param  array<string, mixed>|null  $payload
     */
    protected function maybeCreateCrmNote(Customer $customer, User $actor, ?array $payload): void
    {
        if (! is_array($payload)) {
            return;
        }
        $body = isset($payload['body']) ? trim((string) $payload['body']) : '';
        if ($body === '') {
            return;
        }

        $reminderAt = null;
        if (! empty($payload['reminder_at'])) {
            $timezone = ! empty($payload['timezone']) ? (string) $payload['timezone'] : config('app.timezone', 'UTC');
            $reminderAt = Carbon::parse((string) $payload['reminder_at'], $timezone)->utc();
        }

        CustomerCrmNote::query()->create([
            'customer_id' => $customer->id,
            'user_id' => $actor->id,
            'body' => $body,
            'reminder_at' => $reminderAt,
        ]);
    }

    protected function assertUnderCustomerLimit(Member $owner, ?int $ignoreCustomerId = null): void
    {
        $max = $owner->max_customers;
        if ($max === null) {
            return;
        }

        $query = Customer::withoutGlobalScopes()->where('member_id', $owner->id);
        if ($ignoreCustomerId) {
            $query->whereKeyNot($ignoreCustomerId);
        }
        $count = $query->count();
        if ($count >= $max) {
            throw ValidationException::withMessages([
                'member_id' => [__('Limite clienti del piano raggiunto (:max).', ['max' => $max])],
            ]);
        }
    }
}
