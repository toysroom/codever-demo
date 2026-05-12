<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        $account = $this->route('account');

        return $account instanceof \App\Models\Member && $this->user()?->can('update', $account);
    }

    protected function prepareForValidation(): void
    {
        $password = $this->input('password');
        if ($password === null || $password === '') {
            $this->request->remove('password');
            $this->request->remove('password_confirmation');
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $account = $this->route('account');
        $userId = $account instanceof \App\Models\Member ? $account->user_id : null;

        return [
            'company_name' => ['required', 'string', 'max:255'],
            'company_vat' => ['nullable', 'string', 'max:50'],
            'owner_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$userId],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'license_plan_id' => ['nullable', 'integer', 'exists:license_plans,id'],
            'max_customers' => ['nullable', 'integer', 'min:0'],
            'max_sub_members' => ['nullable', 'integer', 'min:0'],
            'subscription_status' => ['nullable', 'string', 'max:20'],
            'save_redirect' => ['nullable', 'string', 'in:stay,list'],
        ];
    }
}
