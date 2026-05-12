<?php

namespace App\Modules\Customers\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $type = $this->route('customer_type');
        if (! $type instanceof \App\Models\CustomerType) {
            return false;
        }

        return $this->user()->can('update', $type);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'save_redirect' => ['nullable', 'string', 'in:stay,list'],
        ];
    }
}
