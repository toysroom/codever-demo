<?php

namespace App\Modules\Products\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('product_category'));
    }

    protected function prepareForValidation(): void
    {
        if ($this->user() && ! $this->user()->isAdmin()) {
            $owner = $this->user()->getOwnerMember();
            if ($owner) {
                $this->merge(['member_id' => $owner->id]);
            }
        }

        $p = $this->input('parent_id');
        if ($p === '' || $p === null) {
            $this->merge(['parent_id' => null]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'member_id' => ['required', 'integer', 'exists:members,id'],
            'parent_id' => ['nullable', 'integer', 'exists:product_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'save_redirect' => ['nullable', 'string', 'in:stay,list'],
        ];
    }
}
