<?php

namespace App\Modules\Web\Http\Requests;

use App\Models\User;
use App\Models\WebServer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWebServerRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var WebServer $server */
        $server = $this->route('web_server');

        return $this->user() instanceof User && $this->user()->can('update', $server);
    }

    protected function prepareForValidation(): void
    {
        $user = $this->user();
        if ($user instanceof User && ! $user->isAdmin()) {
            $this->merge([
                'member_id' => $user->getOwnerMember()?->id,
            ]);
        }

        $host = $this->input('host');
        if (is_string($host)) {
            $this->merge([
                'host' => strtolower(trim($host)),
            ]);
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
                Rule::exists('members', 'id')->where(fn ($q) => $q->where('is_owner', true)->whereNull(
                    'parent_member_id',
                )),
            ],
            'web_hosting_provider_id' => [
                'required',
                'integer',
                Rule::exists('web_hosting_providers', 'id'),
            ],
            'label' => ['nullable', 'string', 'max:160'],
            'host' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
