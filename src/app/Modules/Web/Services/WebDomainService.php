<?php

namespace App\Modules\Web\Services;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Member;
use App\Models\User;
use App\Models\WebDomain;
use App\Models\WebDomainDatabaseConnection;
use App\Models\WebDomainEmail;
use App\Models\WebDomainFtpAccount;
use App\Modules\Web\Support\WebDomainUrlNormalizer;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WebDomainService
{
    /**
     * @param  array<int, array<string, mixed>>  $ftpAccounts
     * @param  array<int, array<string, mixed>>  $emails
     * @param  array<int, array<string, mixed>>  $databaseConnections
     */
    public function create(User $actor, array $data, array $ftpAccounts = [], array $emails = [], array $databaseConnections = []): WebDomain
    {
        $memberId = $this->assertMemberAccess($actor, (int) $data['member_id']);

        return DB::transaction(function () use ($data, $memberId, $actor, $ftpAccounts, $emails, $databaseConnections): WebDomain {
            $this->assertCustomerAndCompanyForMember((int) $data['customer_id'], (int) $data['company_id'], $memberId);

            $domain = WebDomain::query()->create([
                'member_id' => $memberId,
                'customer_id' => (int) $data['customer_id'],
                'company_id' => (int) $data['company_id'],
                'hostname' => WebDomainUrlNormalizer::normalizeStoredUrl((string) $data['hostname']),
                'notes' => $data['notes'] ?? null,
            ]);

            $this->syncFtpAccounts($domain, $ftpAccounts);
            $this->syncEmails($domain, $emails);
            $this->syncDatabaseConnections($domain, $databaseConnections);

            activity()
                ->performedOn($domain)
                ->causedBy($actor)
                ->log('web_domain.created');

            return $domain->fresh(['ftpAccounts', 'emails', 'databaseConnections']) ?? $domain;
        });
    }

    /**
     * @param  array<int, array<string, mixed>>|null  $ftpAccounts
     * @param  array<int, array<string, mixed>>|null  $emails
     * @param  array<int, array<string, mixed>>|null  $databaseConnections
     */
    public function update(User $actor, WebDomain $webDomain, array $data, ?array $ftpAccounts = null, ?array $emails = null, ?array $databaseConnections = null): WebDomain
    {
        $memberId = $this->assertMemberAccess($actor, (int) $data['member_id'], $webDomain->member_id);

        return DB::transaction(function () use ($actor, $webDomain, $data, $memberId, $ftpAccounts, $emails, $databaseConnections): WebDomain {
            $this->assertCustomerAndCompanyForMember((int) $data['customer_id'], (int) $data['company_id'], $memberId);

            $webDomain->update([
                'member_id' => $memberId,
                'customer_id' => (int) $data['customer_id'],
                'company_id' => (int) $data['company_id'],
                'hostname' => WebDomainUrlNormalizer::normalizeStoredUrl((string) $data['hostname']),
                'notes' => $data['notes'] ?? null,
            ]);

            if (is_array($ftpAccounts)) {
                $this->syncFtpAccounts($webDomain, $ftpAccounts);
            }

            if (is_array($emails)) {
                $this->syncEmails($webDomain, $emails);
            }

            if (is_array($databaseConnections)) {
                $this->syncDatabaseConnections($webDomain, $databaseConnections);
            }

            activity()
                ->performedOn($webDomain)
                ->causedBy($actor)
                ->log('web_domain.updated');

            return $webDomain->fresh(['ftpAccounts', 'emails', 'databaseConnections']) ?? $webDomain;
        });
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    protected function syncFtpAccounts(WebDomain $domain, array $rows): void
    {
        $rows = array_values($rows);
        $keepIds = [];

        foreach ($rows as $row) {
            $id = isset($row['id']) ? (int) $row['id'] : null;
            $password = array_key_exists('password', $row) ? (string) $row['password'] : '';

            if ($id !== null && $id !== 0) {
                $account = WebDomainFtpAccount::query()
                    ->where('web_domain_id', $domain->id)
                    ->whereKey($id)
                    ->first();
                if (! $account) {
                    continue;
                }

                $payload = [
                    'label' => (string) $row['label'],
                    'protocol' => strtolower(trim((string) $row['protocol'])),
                    'host' => (string) $row['host'],
                    'port' => isset($row['port']) && $row['port'] !== null && $row['port'] !== '' ? (int) $row['port'] : null,
                    'username' => (string) $row['username'],
                    'remote_base_path' => (string) ($row['remote_base_path'] ?? ''),
                    'is_default' => filter_var($row['is_default'] ?? false, FILTER_VALIDATE_BOOLEAN),
                    'notes' => $row['notes'] ?? null,
                ];

                if (trim($password) !== '') {
                    $payload['password'] = $password;
                }

                $account->update($payload);
                $keepIds[] = $account->id;

                continue;
            }

            if (trim($password) === '') {
                throw ValidationException::withMessages([
                    'ftp_accounts' => [__('Per ogni nuovo account FTP è obbligatoria la password.')],
                ]);
            }

            $created = WebDomainFtpAccount::query()->create([
                'web_domain_id' => $domain->id,
                'label' => (string) $row['label'],
                'protocol' => strtolower(trim((string) $row['protocol'])),
                'host' => (string) $row['host'],
                'port' => isset($row['port']) && $row['port'] !== null && $row['port'] !== '' ? (int) $row['port'] : null,
                'username' => (string) $row['username'],
                'password' => $password,
                'remote_base_path' => (string) ($row['remote_base_path'] ?? ''),
                'is_default' => filter_var($row['is_default'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'notes' => $row['notes'] ?? null,
            ]);

            $keepIds[] = $created->id;
        }

        WebDomainFtpAccount::query()
            ->where('web_domain_id', $domain->id)
            ->whereNotIn('id', $keepIds)
            ->delete();

        $this->normalizeDefaultFtpAccount($domain->fresh() ?? $domain);
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    protected function syncEmails(WebDomain $domain, array $rows): void
    {
        $rows = array_values($rows);
        $keepIds = [];

        foreach ($rows as $row) {
            $id = isset($row['id']) ? (int) $row['id'] : null;

            $payload = [
                'label' => $row['label'] ?? null,
                'email' => (string) $row['email'],
                'purpose' => $row['purpose'] ?? null,
                'notes' => $row['notes'] ?? null,
            ];

            if ($id !== null && $id !== 0) {
                $record = WebDomainEmail::query()
                    ->where('web_domain_id', $domain->id)
                    ->whereKey($id)
                    ->first();
                if (! $record) {
                    continue;
                }
                $record->update($payload);
                $keepIds[] = $record->id;

                continue;
            }

            $created = WebDomainEmail::query()->create(array_merge($payload, [
                'web_domain_id' => $domain->id,
            ]));
            $keepIds[] = $created->id;
        }

        WebDomainEmail::query()
            ->where('web_domain_id', $domain->id)
            ->whereNotIn('id', $keepIds)
            ->delete();
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    protected function syncDatabaseConnections(WebDomain $domain, array $rows): void
    {
        $rows = array_values($rows);
        $keepIds = [];

        foreach ($rows as $row) {
            $id = isset($row['id']) ? (int) $row['id'] : null;
            $password = array_key_exists('password', $row) ? (string) $row['password'] : '';

            $basePayload = [
                'label' => (string) $row['label'],
                'driver' => strtolower(trim((string) $row['driver'])),
                'host' => (string) $row['host'],
                'port' => isset($row['port']) && $row['port'] !== null && $row['port'] !== '' ? (int) $row['port'] : null,
                'database_name' => (string) $row['database_name'],
                'username' => (string) $row['username'],
                'charset' => isset($row['charset']) && is_string($row['charset']) && trim($row['charset']) !== '' ? trim($row['charset']) : null,
                'is_default' => filter_var($row['is_default'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'notes' => $row['notes'] ?? null,
            ];

            if ($id !== null && $id !== 0) {
                $record = WebDomainDatabaseConnection::query()
                    ->where('web_domain_id', $domain->id)
                    ->whereKey($id)
                    ->first();
                if (! $record) {
                    continue;
                }

                $payload = $basePayload;
                if (trim($password) !== '') {
                    $payload['password'] = $password;
                }
                $record->update($payload);
                $keepIds[] = $record->id;

                continue;
            }

            if (trim($password) === '') {
                throw ValidationException::withMessages([
                    'database_connections' => [__('Per ogni nuova connessione database è obbligatoria la password.')],
                ]);
            }

            $created = WebDomainDatabaseConnection::query()->create(array_merge($basePayload, [
                'web_domain_id' => $domain->id,
                'password' => $password,
            ]));
            $keepIds[] = $created->id;
        }

        WebDomainDatabaseConnection::query()
            ->where('web_domain_id', $domain->id)
            ->whereNotIn('id', $keepIds)
            ->delete();

        $this->normalizeDefaultDatabaseConnection($domain->fresh() ?? $domain);
    }

    protected function normalizeDefaultDatabaseConnection(WebDomain $domain): void
    {
        $records = WebDomainDatabaseConnection::query()
            ->where('web_domain_id', $domain->id)
            ->orderBy('id')
            ->get();

        if ($records->isEmpty()) {
            return;
        }

        $winner = $records->first(fn (WebDomainDatabaseConnection $r): bool => $r->is_default) ?? $records->first();

        foreach ($records as $record) {
            $shouldDefault = $winner !== null && $record->id === $winner->id;
            if ($record->is_default !== $shouldDefault) {
                $record->update(['is_default' => $shouldDefault]);
            }
        }
    }

    protected function normalizeDefaultFtpAccount(WebDomain $domain): void
    {
        $accounts = WebDomainFtpAccount::query()
            ->where('web_domain_id', $domain->id)
            ->orderBy('id')
            ->get();

        if ($accounts->isEmpty()) {
            return;
        }

        $winner = $accounts->first(fn (WebDomainFtpAccount $a): bool => $a->is_default) ?? $accounts->first();

        foreach ($accounts as $account) {
            $shouldDefault = $winner !== null && $account->id === $winner->id;
            if ($account->is_default !== $shouldDefault) {
                $account->update(['is_default' => $shouldDefault]);
            }
        }
    }

    public function delete(User $actor, WebDomain $webDomain): void
    {
        DB::transaction(function () use ($actor, $webDomain): void {
            $webDomain->delete();

            activity()
                ->performedOn($webDomain)
                ->causedBy($actor)
                ->log('web_domain.deleted');
        });
    }

    protected function assertCustomerAndCompanyForMember(int $customerId, int $companyId, int $memberId): void
    {
        $customer = Customer::withoutGlobalScopes()->whereKey($customerId)->first();
        if (! $customer || (int) $customer->member_id !== $memberId) {
            throw ValidationException::withMessages([
                'customer_id' => [__('Il cliente non appartiene all’account selezionato.')],
            ]);
        }

        $company = Company::withoutGlobalScopes()->whereKey($companyId)->first();
        if (! $company || (int) $company->member_id !== $memberId) {
            throw ValidationException::withMessages([
                'company_id' => [__('L’azienda non appartiene all’account selezionato.')],
            ]);
        }
    }

    protected function assertMemberAccess(User $actor, int $memberId, ?int $existingMemberId = null): int
    {
        $owner = Member::query()->owners()->whereKey($memberId)->first();
        if (! $owner) {
            throw ValidationException::withMessages([
                'member_id' => [__('L\'account selezionato non è valido.')],
            ]);
        }

        if (! $actor->isAdmin() && $actor->getOwnerMember()?->id !== $owner->id) {
            throw ValidationException::withMessages([
                'member_id' => [__('Non puoi usare un account diverso dal tuo.')],
            ]);
        }

        if (! $actor->isAdmin() && $existingMemberId !== null && $existingMemberId !== $owner->id) {
            throw ValidationException::withMessages([
                'member_id' => [__('Non puoi spostare il record su un altro account.')],
            ]);
        }

        return $owner->id;
    }
}
