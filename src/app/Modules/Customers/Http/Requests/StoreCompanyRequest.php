<?php

namespace App\Modules\Customers\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $user = $this->user();
        if ($user && ! $user->isAdmin() && ($owner = $user->getOwnerMember())) {
            $this->merge(['member_id' => $owner->id]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'member_id' => [
                'required',
                'integer',
                Rule::exists('members', 'id')->where(
                    fn ($q) => $q->where('is_owner', true)->whereNull('parent_member_id'),
                ),
            ],
            'name' => ['required', 'string', 'max:255'],
            'legal_name' => ['nullable', 'string', 'max:255'],
            'vat_number' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'pec' => ['nullable', 'string', 'email', 'max:255'],
            'sdi_recipient_code' => ['nullable', 'string', 'max:10'],
            'address' => ['nullable', 'string', 'max:2048'],
            'city' => ['nullable', 'string', 'max:128'],
            'postal_code' => ['nullable', 'string', 'max:16'],
            'province' => ['nullable', 'string', 'max:8'],
            'country' => ['nullable', 'string', 'max:2'],
            'notes' => ['nullable', 'string', 'max:65535'],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }
}
