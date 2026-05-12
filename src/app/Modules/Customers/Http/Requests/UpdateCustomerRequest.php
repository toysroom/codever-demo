<?php

namespace App\Modules\Customers\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        $customer = $this->route('customer');
        if (! $customer instanceof \App\Models\Customer) {
            return false;
        }

        return $this->user()->can('update', $customer);
    }

    protected function prepareForValidation(): void
    {
        if ($this->user() && ! $this->user()->isAdmin()) {
            $customer = $this->route('customer');
            if ($customer instanceof \App\Models\Customer) {
                $this->merge(['member_id' => $customer->member_id]);
            }
        }

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
        $customer = $this->route('customer');
        $userId = $customer instanceof \App\Models\Customer ? $customer->user_id : null;

        return [
            'member_id' => ['required', 'integer', 'exists:members,id'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'external_code' => ['nullable', 'string', 'max:64'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'reference_person' => ['nullable', 'string', 'max:255'],
            'vat_number' => ['nullable', 'string', 'max:32'],
            'fiscal_code' => ['nullable', 'string', 'max:32'],
            'phone' => ['nullable', 'string', 'max:50'],
            'mobile_phone' => ['nullable', 'string', 'max:50'],
            'fax' => ['nullable', 'string', 'max:50'],
            'contact_email' => ['nullable', 'string', 'email', 'max:255'],
            'pec' => ['nullable', 'string', 'email', 'max:255'],
            'sdi_recipient_code' => ['nullable', 'string', 'max:16'],
            'website' => ['nullable', 'string', 'max:512'],
            'notes' => ['nullable', 'string', 'max:10000'],
            'entity_type' => ['nullable', 'string', 'max:64'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'iban' => ['nullable', 'string', 'max:34'],
            'address' => ['nullable', 'string', 'max:5000'],
            'street' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'postal_code' => ['nullable', 'string', 'max:32'],
            'province' => ['nullable', 'string', 'max:16'],
            'country' => ['nullable', 'string', 'max:120'],
            'contacts' => ['nullable', 'array'],
            'contacts.*.type' => ['nullable', 'string', Rule::in(['mobile', 'landline', 'email', 'fax', 'pec', 'other'])],
            'contacts.*.label' => ['nullable', 'string', 'max:255'],
            'contacts.*.value' => ['nullable', 'string', 'max:500'],
            'new_crm_note' => ['nullable', 'array'],
            'new_crm_note.body' => ['nullable', 'string', 'max:10000'],
            'new_crm_note.reminder_at' => ['nullable', 'date'],
            'new_crm_note.timezone' => ['nullable', 'timezone'],
            'customer_type_ids' => ['nullable', 'array'],
            'customer_type_ids.*' => ['integer', Rule::exists('customer_types', 'id')->where('member_id', $this->input('member_id'))],
            'save_redirect' => ['nullable', 'in:stay,list'],
        ];
    }
}
