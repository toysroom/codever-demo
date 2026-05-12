<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\Member::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'company_name' => ['required', 'string', 'max:255'],
            'company_vat' => ['nullable', 'string', 'max:50'],
            'owner_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'license_plan_id' => ['nullable', 'integer', 'exists:license_plans,id'],
            'max_customers' => ['nullable', 'integer', 'min:0'],
            'max_sub_members' => ['nullable', 'integer', 'min:0'],
            'subscription_status' => ['nullable', 'string', 'max:20'],
        ];
    }
}
