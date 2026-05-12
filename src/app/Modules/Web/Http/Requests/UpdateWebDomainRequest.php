<?php

namespace App\Modules\Web\Http\Requests;

use App\Models\User;
use App\Models\WebDomain;
use App\Modules\Web\Support\WebDomainNestedRules;
use App\Modules\Web\Support\WebDomainUrlNormalizer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWebDomainRequest extends FormRequest
{
    public function authorize(): bool
    {
        $domain = $this->route('web_domain');

        return $domain instanceof WebDomain
            && $this->user() instanceof User
            && $this->user()->can('update', $domain);
    }

    protected function prepareForValidation(): void
    {
        $user = $this->user();
        if ($user instanceof User && ! $user->isAdmin()) {
            $this->merge([
                'member_id' => $user->getOwnerMember()?->id,
            ]);
        }

        $host = $this->input('hostname');
        if (is_string($host) && $host !== '') {
            $this->merge(['hostname' => WebDomainUrlNormalizer::normalizeStoredUrl($host)]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var WebDomain $existing */
        $existing = $this->route('web_domain');
        $memberId = (int) $this->input('member_id');

        return [
            'member_id' => [
                'required',
                'integer',
                Rule::exists('members', 'id')->where(fn ($q) => $q->where('is_owner', true)->whereNull('parent_member_id')),
            ],
            'customer_id' => [
                'required',
                'integer',
                Rule::exists('customers', 'id')->where(fn ($q) => $q->where('member_id', $memberId)->whereNull('deleted_at')),
            ],
            'company_id' => [
                'required',
                'integer',
                Rule::exists('companies', 'id')->where(fn ($q) => $q->where('member_id', $memberId)->whereNull('deleted_at')),
            ],
            'hostname' => [
                'required',
                'string',
                'max:512',
                'regex:/^https?:\/\/\S+$/i',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $hostPart = parse_url((string) $value, PHP_URL_HOST);

                    if (! is_string($hostPart) || $hostPart === '') {
                        $fail(__("L'URL deve includere un host valido dopo http:// o https://."));
                    }
                },
                Rule::unique('web_domains', 'hostname')
                    ->ignore($existing->id)
                    ->where(fn ($query) => $query->where('member_id', $memberId)->whereNull('deleted_at')),
            ],
            'notes' => ['nullable', 'string', 'max:5000'],
            'save_redirect' => ['nullable', 'string', 'in:stay,list'],
            ...WebDomainNestedRules::ftpAccountsForUpdate($existing),
            ...WebDomainNestedRules::emailsForUpdate($existing),
            ...WebDomainNestedRules::databaseConnectionsForUpdate($existing),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'hostname.regex' => __('Inserisci un URL completo con http:// oppure https:// (es. https://www.esempio.it/).'),
        ];
    }
}
