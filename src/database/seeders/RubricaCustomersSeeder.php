<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\CustomerType;
use App\Models\Member;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Importa i record da {@see storage_path('Rubrica.csv')}.
 *
 * Crea per ogni riga con email valida nella colonna CSV "Email" un utente `customer` e la scheda sul primo Member owner.
 * Le righe senza email valida vengono saltate (nessun indirizzo sintetico).
 *
 * Richiede {@see CustomerTypesSeeder} (tipi "Cliente" e "Fornitore"): la colonna CSV "Tipo" determina
 * le etichette sulla pivot (CLIENTE, FORNITORE, CLIENTE/FORNITORE).
 *
 * Password di accesso per gli account creati: {@see RubricaCustomersSeeder::PASSWORD}.
 */
class RubricaCustomersSeeder extends Seeder
{
    public const PASSWORD = 'rubrica';

    private const CSV_BASENAME = 'Rubrica.csv';

    /**
     * Intestazioni attese (ordine colonne Rubrica.csv).
     *
     * @var list<string>
     */
    private const HEADER_KEYS = [
        'Cod.',
        'Rag. Sociale',
        'Riferimento',
        'P.IVA',
        'Cod. fiscale',
        'Indirizzo',
        'Città',
        'Provincia',
        'CAP',
        'Paese',
        'Telefono',
        'Cellulare',
        'FAX',
        'Email',
        'Pec',
        'Cod. Destinatario',
        'Web',
        'Nota',
        'Tipo',
        'Nome banca',
        'IBAN',
    ];

    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $path = storage_path(self::CSV_BASENAME);
        if (! is_readable($path)) {
            $this->command?->warn(self::CSV_BASENAME.' non leggibile in storage, skip.');

            return;
        }

        $member = $this->resolveTargetMember();
        if (! $member) {
            $this->command?->warn('Nessun Member owner trovato: eseguire prima DemoMemberOwnerSeeder / seed account.');

            return;
        }

        // Permette di ospitare tutti i record importati senza bloccare i create via UI sul piano Free.
        $member->forceFill(['max_customers' => null])->save();

        $handle = fopen($path, 'rb');
        if ($handle === false) {
            $this->command?->error('Impossibile aprire '.self::CSV_BASENAME);

            return;
        }

        $headerRow = fgetcsv($handle, 0, ';', '"', '\\');
        if ($headerRow === false) {
            fclose($handle);

            return;
        }

        $this->stripBomHeaderRow($headerRow);
        if (! $this->headersMatch($headerRow)) {
            fclose($handle);
            $this->command?->error('Intestazione Rubrica.csv non riconosciuta: aggiornare RubricaCustomersSeeder::HEADER_KEYS.');

            return;
        }

        $passwordHash = Hash::make(self::PASSWORD);
        $customerRole = Role::query()->where('name', 'customer')->first();

        $typeClienteId = CustomerType::withoutGlobalScopes()
            ->where('member_id', $member->id)
            ->where('name', 'Cliente')
            ->value('id');
        $typeFornitoreId = CustomerType::withoutGlobalScopes()
            ->where('member_id', $member->id)
            ->where('name', 'Fornitore')
            ->value('id');

        if (! $typeClienteId || ! $typeFornitoreId) {
            fclose($handle);
            $this->command?->error(
                'Tipi cliente "Cliente" / "Fornitore" mancanti per member_id='.$member->id.'. Eseguire prima CustomerTypesSeeder.'
            );

            return;
        }

        $inserted = 0;
        $skippedInvalidEmail = 0;

        try {
            DB::transaction(function () use ($handle, $member, $passwordHash, $customerRole, $typeClienteId, $typeFornitoreId, &$inserted, &$skippedInvalidEmail): void {
                $rowIndex = 1;
                while (($row = fgetcsv($handle, 0, ';', '"', '\\')) !== false) {
                    $rowIndex++;
                    if ($this->rowIsEmpty($row)) {
                        continue;
                    }

                    $payload = $this->mapRow($row, $rowIndex);
                    if ($payload === null) {
                        continue;
                    }

                    $loginEmail = $this->resolveLoginEmail($payload['csv_email']);
                    if ($loginEmail === null) {
                        $skippedInvalidEmail++;

                        continue;
                    }

                    $user = User::withoutGlobalScopes()->updateOrCreate(
                        ['email' => $loginEmail],
                        [
                            'name' => Str::limit($payload['display_name'], 255),
                            'password' => $passwordHash,
                            'user_type' => 'customer',
                            'is_active' => true,
                            'email_verified_at' => now(),
                        ]
                    );

                    if ($customerRole && ! $user->hasRole('customer')) {
                        $user->syncRoles(['customer']);
                    }

                    /** @var Customer $customer */
                    $customer = Customer::withoutGlobalScopes()->updateOrCreate(
                        ['user_id' => $user->id],
                        [
                            'member_id' => $member->id,
                            'external_code' => $payload['external_code'],
                            'company_name' => $payload['company_name'],
                            'reference_person' => $payload['reference_person'],
                            'first_name' => $payload['first_name'],
                            'last_name' => $payload['last_name'],
                            'vat_number' => $payload['vat_number'],
                            'fiscal_code' => $payload['fiscal_code'],
                            'phone' => $payload['phone'],
                            'mobile_phone' => $payload['mobile_phone'],
                            'fax' => $payload['fax'],
                            'contact_email' => $payload['contact_email'],
                            'pec' => $payload['pec'],
                            'sdi_recipient_code' => $payload['sdi_recipient_code'],
                            'website' => $payload['website'],
                            'notes' => $payload['notes'],
                            'entity_type' => $payload['entity_type'],
                            'bank_name' => $payload['bank_name'],
                            'iban' => $payload['iban'],
                            'address' => null,
                            'street' => $payload['street'],
                            'city' => $payload['city'],
                            'postal_code' => $payload['postal_code'],
                            'province' => $payload['province'],
                            'country' => $payload['country'],
                        ]
                    );

                    $this->syncCustomerTypesFromCsvTipo(
                        $customer,
                        $payload['entity_type'],
                        (int) $typeClienteId,
                        (int) $typeFornitoreId
                    );

                    $inserted++;
                }
            });
        } finally {
            fclose($handle);
        }

        $this->command?->info("Rubrica importata: {$inserted} clienti sull'account member_id={$member->id}.");
        if ($skippedInvalidEmail > 0) {
            $this->command?->warn("Saltate {$skippedInvalidEmail} righe: colonna Email assente o non valida.");
        }
    }

    /**
     * Allinea la pivot customer ↔ tipi in base alla colonna CSV "Tipo" (es. CLIENTE, FORNITORE, CLIENTE/FORNITORE).
     */
    protected function syncCustomerTypesFromCsvTipo(Customer $customer, ?string $tipoRaw, int $clienteTypeId, int $fornitoreTypeId): void
    {
        $ids = [];
        $normalized = $tipoRaw !== null && trim($tipoRaw) !== ''
            ? mb_strtoupper(trim(str_replace('\\', '/', $tipoRaw)))
            : '';

        if ($normalized !== '') {
            if (str_contains($normalized, 'CLIENTE')) {
                $ids[] = $clienteTypeId;
            }
            if (str_contains($normalized, 'FORNITORE')) {
                $ids[] = $fornitoreTypeId;
            }
        }

        if ($ids === []) {
            $ids[] = $clienteTypeId;
        }

        $customer->customerTypes()->sync(array_values(array_unique($ids)));
    }

    protected function resolveTargetMember(): ?Member
    {
        $email = env('RUBRICA_SEED_OWNER_EMAIL');
        $query = Member::query()->owners()->orderBy('id');

        if (is_string($email) && $email !== '') {
            $query->whereHas('user', fn ($q) => $q->where('email', $email));
        }

        return $query->first();
    }

    /**
     * @param  list<string|null>|false  $headerRow
     */
    protected function headersMatch(array $headerRow): bool
    {
        if (count($headerRow) < count(self::HEADER_KEYS)) {
            return false;
        }

        foreach (self::HEADER_KEYS as $i => $expected) {
            if ($this->normalizeHeaderCell($headerRow[$i] ?? '') !== $expected) {
                return false;
            }
        }

        return true;
    }

    protected function normalizeHeaderCell(?string $cell): string
    {
        return trim((string) $cell, " \t\n\r\0\x0B\"");
    }

    /**
     * @param  list<string|null>  $row
     */
    protected function rowIsEmpty(array $row): bool
    {
        foreach ($row as $cell) {
            if ($this->normalizeScalar($cell) !== null) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  list<string|null>  $row
     * @return array<string, mixed>|null
     */
    protected function mapRow(array $row, int $rowIndex): ?array
    {
        $cod = $this->normalizeScalar($row[0] ?? null);
        $company = $this->normalizeScalar($row[1] ?? null);

        if ($cod === null && $company === null) {
            return null;
        }

        $externalCode = $cod ?? ('row-'.$rowIndex);

        [$firstName, $lastName] = $this->splitPersonName($company ?? '', $externalCode);

        $csvEmail = $this->normalizeScalar($row[13] ?? null);

        return [
            'external_code' => $this->trunc($externalCode, 64),
            'company_name' => $this->trunc($company, 255),
            'reference_person' => $this->trunc($this->normalizeScalar($row[2] ?? null), 255),
            'first_name' => $firstName,
            'last_name' => $lastName,
            'vat_number' => $this->trunc($this->normalizeScalar($row[3] ?? null), 32),
            'fiscal_code' => $this->trunc($this->normalizeScalar($row[4] ?? null), 32),
            'street' => $this->trunc($this->normalizeScalar($row[5] ?? null), 255),
            'city' => $this->trunc($this->normalizeScalar($row[6] ?? null), 120),
            'province' => $this->trunc($this->normalizeScalar($row[7] ?? null), 16),
            'postal_code' => $this->trunc($this->normalizeScalar($row[8] ?? null), 32),
            'country' => $this->trunc($this->normalizeScalar($row[9] ?? null), 120),
            'phone' => $this->trunc($this->normalizeScalar($row[10] ?? null), 50),
            'mobile_phone' => $this->trunc($this->normalizeScalar($row[11] ?? null), 50),
            'fax' => $this->trunc($this->normalizeScalar($row[12] ?? null), 50),
            'csv_email' => $csvEmail,
            'contact_email' => $csvEmail && filter_var($csvEmail, FILTER_VALIDATE_EMAIL)
                ? $this->trunc($csvEmail, 255)
                : null,
            'pec' => $this->truncPec($this->normalizeScalar($row[14] ?? null)),
            'sdi_recipient_code' => $this->trunc($this->normalizeScalar($row[15] ?? null), 16),
            'website' => $this->trunc($this->normalizeScalar($row[16] ?? null), 512),
            'notes' => $this->normalizeScalar($row[17] ?? null),
            'entity_type' => $this->trunc($this->normalizeScalar($row[18] ?? null), 64),
            'bank_name' => $this->trunc($this->normalizeScalar($row[19] ?? null), 255),
            'iban' => $this->trunc($this->normalizeScalar($row[20] ?? null), 34),
            'display_name' => $company ?? ('Cliente '.$externalCode),
        ];
    }

    /**
     * Solo email reali dal CSV; niente indirizzi sintetici.
     */
    protected function resolveLoginEmail(?string $csvEmail): ?string
    {
        if (! $csvEmail || ! filter_var($csvEmail, FILTER_VALIDATE_EMAIL)) {
            return null;
        }

        return $csvEmail;
    }

    /**
     * @return array{0: string, 1: string}
     */
    protected function splitPersonName(string $company, string $fallbackCod): array
    {
        $company = trim($company);
        if ($company === '') {
            return ['Cliente', $this->trunc($fallbackCod, 255) ?? '—'];
        }

        $parts = preg_split('/\s+/u', $company, -1, PREG_SPLIT_NO_EMPTY);
        $first = array_shift($parts) ?? 'Cliente';
        $last = trim(implode(' ', $parts));
        if ($last === '') {
            $last = '#'.$fallbackCod;
        }

        return [
            $this->trunc($first, 255) ?? 'Cliente',
            $this->trunc($last, 255) ?? '#',
        ];
    }

    protected function truncPec(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return $this->trunc($value, 255);
    }

    protected function trunc(?string $value, int $max): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return Str::limit($value, $max, '');
    }

    protected function normalizeScalar(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $v = trim($value);
        if ($v === '' || strcasecmp($v, 'null') === 0) {
            return null;
        }

        return $v;
    }

    /**
     * @param  list<string|null>  $row
     */
    protected function stripBomHeaderRow(array &$row): void
    {
        if ($row === [] || ! isset($row[0])) {
            return;
        }

        $row[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string) $row[0]);
    }
}
