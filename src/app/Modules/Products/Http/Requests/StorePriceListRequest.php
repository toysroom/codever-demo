<?php

namespace App\Modules\Products\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePriceListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\PriceList::class);
    }

    protected function prepareForValidation(): void
    {
        if ($this->user() && ! $this->user()->isAdmin()) {
            $owner = $this->user()->getOwnerMember();
            if ($owner) {
                $this->merge(['member_id' => $owner->id]);
            }
        }

        $this->merge([
            'is_default' => $this->boolean('is_default'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'member_id' => ['required', 'integer', 'exists:members,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:64'],
            'currency' => ['required', 'string', 'size:3'],
            'valid_from' => ['nullable', 'date'],
            'valid_to' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'is_default' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
