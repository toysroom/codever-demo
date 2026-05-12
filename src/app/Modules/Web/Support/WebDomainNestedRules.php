<?php

namespace App\Modules\Web\Support;

use App\Models\WebDomain;
use Illuminate\Validation\Rule;

final class WebDomainNestedRules
{
    /**
     * @return array<string, mixed>
     */
    public static function ftpAccountsForStore(): array
    {
        return [
            'ftp_accounts' => ['nullable', 'array'],
            'ftp_accounts.*.label' => ['required', 'string', 'max:255'],
            'ftp_accounts.*.protocol' => ['required', 'string', Rule::in(['sftp', 'ftp', 'ftps'])],
            'ftp_accounts.*.host' => ['required', 'string', 'max:255'],
            'ftp_accounts.*.port' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'ftp_accounts.*.username' => ['required', 'string', 'max:255'],
            'ftp_accounts.*.password' => ['required', 'string', 'max:512'],
            'ftp_accounts.*.remote_base_path' => ['nullable', 'string', 'max:1024'],
            'ftp_accounts.*.is_default' => ['sometimes', 'boolean'],
            'ftp_accounts.*.notes' => ['nullable', 'string', 'max:5000'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function ftpAccountsForUpdate(WebDomain $domain): array
    {
        return [
            'ftp_accounts' => ['nullable', 'array'],
            'ftp_accounts.*.id' => [
                'nullable',
                'integer',
                Rule::exists('web_domain_ftp_accounts', 'id')->where('web_domain_id', $domain->id),
            ],
            'ftp_accounts.*.label' => ['required', 'string', 'max:255'],
            'ftp_accounts.*.protocol' => ['required', 'string', Rule::in(['sftp', 'ftp', 'ftps'])],
            'ftp_accounts.*.host' => ['required', 'string', 'max:255'],
            'ftp_accounts.*.port' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'ftp_accounts.*.username' => ['required', 'string', 'max:255'],
            'ftp_accounts.*.password' => ['nullable', 'string', 'max:512'],
            'ftp_accounts.*.remote_base_path' => ['nullable', 'string', 'max:1024'],
            'ftp_accounts.*.is_default' => ['sometimes', 'boolean'],
            'ftp_accounts.*.notes' => ['nullable', 'string', 'max:5000'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function emailsForStore(): array
    {
        return [
            'emails' => ['nullable', 'array'],
            'emails.*.label' => ['nullable', 'string', 'max:255'],
            'emails.*.email' => ['required', 'string', 'email:rfc', 'max:255'],
            'emails.*.purpose' => ['nullable', 'string', Rule::in(['contact', 'technical', 'billing', 'other'])],
            'emails.*.notes' => ['nullable', 'string', 'max:5000'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function emailsForUpdate(WebDomain $domain): array
    {
        return [
            'emails' => ['nullable', 'array'],
            'emails.*.id' => [
                'nullable',
                'integer',
                Rule::exists('web_domain_emails', 'id')->where('web_domain_id', $domain->id),
            ],
            'emails.*.label' => ['nullable', 'string', 'max:255'],
            'emails.*.email' => ['required', 'string', 'email:rfc', 'max:255'],
            'emails.*.purpose' => ['nullable', 'string', Rule::in(['contact', 'technical', 'billing', 'other'])],
            'emails.*.notes' => ['nullable', 'string', 'max:5000'],
        ];
    }

    /**
     * Credenziali DB del sito (MySQL/MariaDB/PostgreSQL).
     *
     * @return array<string, mixed>
     */
    public static function databaseConnectionsForStore(): array
    {
        return [
            'database_connections' => ['nullable', 'array'],
            'database_connections.*.label' => ['required', 'string', 'max:255'],
            'database_connections.*.driver' => ['required', 'string', Rule::in(['mysql', 'mariadb', 'pgsql'])],
            'database_connections.*.host' => ['required', 'string', 'max:255'],
            'database_connections.*.port' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'database_connections.*.database_name' => ['required', 'string', 'max:255'],
            'database_connections.*.username' => ['required', 'string', 'max:255'],
            'database_connections.*.password' => ['required', 'string', 'max:512'],
            'database_connections.*.charset' => ['nullable', 'string', 'max:64'],
            'database_connections.*.is_default' => ['sometimes', 'boolean'],
            'database_connections.*.notes' => ['nullable', 'string', 'max:5000'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function databaseConnectionsForUpdate(WebDomain $domain): array
    {
        return [
            'database_connections' => ['nullable', 'array'],
            'database_connections.*.id' => [
                'nullable',
                'integer',
                Rule::exists('web_domain_database_connections', 'id')->where('web_domain_id', $domain->id),
            ],
            'database_connections.*.label' => ['required', 'string', 'max:255'],
            'database_connections.*.driver' => ['required', 'string', Rule::in(['mysql', 'mariadb', 'pgsql'])],
            'database_connections.*.host' => ['required', 'string', 'max:255'],
            'database_connections.*.port' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'database_connections.*.database_name' => ['required', 'string', 'max:255'],
            'database_connections.*.username' => ['required', 'string', 'max:255'],
            'database_connections.*.password' => ['nullable', 'string', 'max:512'],
            'database_connections.*.charset' => ['nullable', 'string', 'max:64'],
            'database_connections.*.is_default' => ['sometimes', 'boolean'],
            'database_connections.*.notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
