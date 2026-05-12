<?php

namespace App\Modules\Products\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('product'));
    }

    protected function prepareForValidation(): void
    {
        if ($this->user() && ! $this->user()->isAdmin()) {
            $owner = $this->user()->getOwnerMember();
            if ($owner) {
                $this->merge(['member_id' => $owner->id]);
            }
        }

        $c = $this->input('product_category_id');
        if ($c === '' || $c === null) {
            $this->merge(['product_category_id' => null]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'member_id' => ['required', 'integer', 'exists:members,id'],
            'product_category_id' => ['nullable', 'integer', 'exists:product_categories,id'],
            'code' => [
                'required',
                'string',
                'max:128',
                Rule::unique('products', 'code')
                    ->where(fn ($q) => $q->where('member_id', (int) $this->input('member_id')))
                    ->ignore($this->route('product')->id),
            ],
            'name' => ['required', 'string', 'max:500'],
            'invoice_text' => ['nullable', 'string', 'max:5000'],
            'revenue_code' => ['nullable', 'string', 'max:128'],
            'revenue_description' => ['nullable', 'string', 'max:5000'],
            'sales_code' => ['nullable', 'string', 'max:128'],
            'sales_description' => ['nullable', 'string', 'max:5000'],
            'line_kind' => ['nullable', 'string', 'max:32', 'in:revenue,sales,other'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'prices' => ['nullable', 'array'],
            'prices.*.price_list_id' => ['required_with:prices', 'integer', 'exists:price_lists,id'],
            'prices.*.amount' => ['nullable', 'numeric', 'min:0'],
            'save_redirect' => ['nullable', 'string', 'in:stay,list'],
        ];
    }
}
