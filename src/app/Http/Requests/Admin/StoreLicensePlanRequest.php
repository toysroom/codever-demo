<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLicensePlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('settings.license_plans.index') ?? false;
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('slug') === '') {
            $this->merge(['slug' => null]);
        }
        if ($this->input('package_tier') === '') {
            $this->merge(['package_tier' => null]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:license_plans,slug'],
            'package_tier' => ['nullable', 'string', Rule::in(['basic', 'premium', 'enterprise']), 'unique:license_plans,package_tier'],
            'description' => ['nullable', 'string', 'max:5000'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'billing_period' => ['nullable', 'string', Rule::in(['monthly', 'yearly'])],
            'annual_term_months' => ['required', 'integer', 'min:1', 'max:120'],
            'trial_days' => ['required', 'integer', 'min:0'],
            'max_customers' => ['nullable', 'integer', 'min:0'],
            'max_sub_members' => ['nullable', 'integer', 'min:0'],
            'features_json' => ['nullable', 'string', 'max:10000'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['required', 'integer', 'min:0'],
            'redirect_to_index' => ['sometimes', 'boolean'],
        ];
    }
}
