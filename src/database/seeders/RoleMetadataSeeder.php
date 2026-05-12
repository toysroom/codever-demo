<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\RoleMetadata;
use Illuminate\Database\Seeder;

class RoleMetadataSeeder extends Seeder
{
    /**
     * Descrizioni ruoli (IT) per la tabella dedicata.
     *
     * @var array<string, string>
     */
    private const DESCRIPTIONS = [
        'admin' => 'Accesso completo alla piattaforma, bypass dell’isolamento account e gestione impostazioni di sistema.',
        'customer' => 'Accesso molto limitato, tipicamente per utenti finali del servizio.',
        'member_owner' => 'Proprietario dell’account: gestisce il proprio membro e i dati nel perimetro del piano.',
        'sub_member' => 'Utente con permessi limitati all’interno dell’account, definiti dal member owner.',
    ];

    public function run(): void
    {
        foreach (Role::query()->cursor() as $role) {
            $description = self::DESCRIPTIONS[$role->name] ?? null;

            RoleMetadata::query()->updateOrCreate(
                ['role_id' => $role->id],
                [
                    'is_disabled' => in_array($role->name, ['admin', 'customer'], true),
                    'description' => $description,
                ],
            );
        }
    }
}
