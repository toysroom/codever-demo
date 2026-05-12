<?php

namespace App\Modules\Web\Http\Requests;

use App\Models\User;
use App\Models\WebHostingProvider;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreWebHostingProviderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() instanceof User && $this->user()->can('create', WebHostingProvider::class);
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('slug')) {
            $this->merge([
                'slug' => Str::slug((string) $this->input('slug')),
            ]);
        }

        $name = $this->input('name');
        if ((! $this->filled('slug')) && is_string($name) && $name !== '') {
            $this->merge([
                'slug' => Str::slug($name),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'slug' => [
                'required',
                'string',
                'max:96',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('web_hosting_providers', 'slug'),
            ],
            'name' => ['required', 'string', 'max:160'],
            'website_url' => ['nullable', 'string', 'max:512', 'url'],
        ];
    }
}
