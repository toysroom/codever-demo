<?php

namespace Database\Seeders;

use App\Models\PermissionDescription;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionDescriptionSeeder extends Seeder
{
    /**
     * Descrizioni leggibili per i permessi Spatie (tabella `permission_descriptions`).
     *
     * @var array<string, array{it: string, en: string}>
     */
    private const COPY = [
        'dashboard.index' => [
            'it' => 'Consente di aprire la dashboard principale dell’applicazione.',
            'en' => 'Allows opening the main application dashboard.',
        ],
        'customers.index' => [
            'it' => 'Consente di visualizzare l’elenco dei clienti del modulo Clienti.',
            'en' => 'Allows viewing the customer list in the Customers module.',
        ],
        'customers.show' => [
            'it' => 'Consente di aprire il dettaglio di un singolo cliente.',
            'en' => 'Allows viewing a single customer’s details.',
        ],
        'customers.create' => [
            'it' => 'Consente di accedere al form di creazione di un nuovo cliente.',
            'en' => 'Allows accessing the form to create a new customer.',
        ],
        'customers.update' => [
            'it' => 'Consente di modificare i dati di un cliente esistente.',
            'en' => 'Allows updating an existing customer’s data.',
        ],
        'customers.delete' => [
            'it' => 'Consente di eliminare (soft delete) un cliente.',
            'en' => 'Allows deleting (soft delete) a customer.',
        ],
        'companies.index' => [
            'it' => 'Consente di visualizzare l’elenco delle aziende (anagrafica società dell’account).',
            'en' => 'Allows viewing the list of companies (organization master data).',
        ],
        'companies.show' => [
            'it' => 'Consente di aprire il dettaglio di un’azienda.',
            'en' => 'Allows viewing a single company’s details.',
        ],
        'companies.create' => [
            'it' => 'Consente di creare una nuova anagrafica azienda.',
            'en' => 'Allows creating a new company record.',
        ],
        'companies.update' => [
            'it' => 'Consente di modificare un’azienda esistente.',
            'en' => 'Allows updating an existing company.',
        ],
        'companies.delete' => [
            'it' => 'Consente di eliminare (soft delete) un’azienda.',
            'en' => 'Allows deleting (soft delete) a company.',
        ],
        'web_domains.index' => [
            'it' => 'Consente di visualizzare l’elenco dei domini (modulo Web).',
            'en' => 'Allows viewing domain names list (Web module).',
        ],
        'web_domains.show' => [
            'it' => 'Consente di aprire il dettaglio di un dominio.',
            'en' => 'Allows viewing a single domain’s details.',
        ],
        'web_domains.create' => [
            'it' => 'Consente di registrare un nuovo dominio.',
            'en' => 'Allows registering a new domain.',
        ],
        'web_domains.update' => [
            'it' => 'Consente di modificare un dominio esistente.',
            'en' => 'Allows updating an existing domain.',
        ],
        'web_domains.delete' => [
            'it' => 'Consente di eliminare un dominio.',
            'en' => 'Allows deleting a domain.',
        ],
        'web_hosting_providers.index' => [
            'it' => 'Consente di visualizzare il catalogo fornitori hosting (modulo Web).',
            'en' => 'Allows viewing the hosting providers catalog (Web module).',
        ],
        'web_hosting_providers.show' => [
            'it' => 'Consente di aprire il dettaglio di un fornitore hosting.',
            'en' => 'Allows viewing a hosting provider’s details.',
        ],
        'web_hosting_providers.create' => [
            'it' => 'Consente di aggiungere un fornitore hosting al catalogo.',
            'en' => 'Allows adding a hosting provider to the catalog.',
        ],
        'web_hosting_providers.update' => [
            'it' => 'Consente di modificare un fornitore hosting esistente.',
            'en' => 'Allows updating an existing hosting provider.',
        ],
        'web_hosting_providers.delete' => [
            'it' => 'Consente di eliminare un fornitore hosting (se non è collegato a server).',
            'en' => 'Allows deleting a hosting provider when not referenced by servers.',
        ],
        'web_servers.index' => [
            'it' => 'Consente di visualizzare i server infra collegati al modulo Web.',
            'en' => 'Allows viewing infrastructure servers linked to the Web module.',
        ],
        'web_servers.show' => [
            'it' => 'Consente di aprire il dettaglio di un server.',
            'en' => 'Allows viewing a server record’s details.',
        ],
        'web_servers.create' => [
            'it' => 'Consente di registrare un nuovo server (provider + host/IP).',
            'en' => 'Allows registering a new server (provider + host/IP).',
        ],
        'web_servers.update' => [
            'it' => 'Consente di modificare un server esistente.',
            'en' => 'Allows updating an existing server record.',
        ],
        'web_servers.delete' => [
            'it' => 'Consente di eliminare un server dall’account.',
            'en' => 'Allows deleting a server record for the account.',
        ],
        'settings.modules.index' => [
            'it' => 'Consente di assegnare i moduli agli account (es. modulo Clienti).',
            'en' => 'Allows assigning modules to accounts (e.g. Customers module).',
        ],
        'settings.accounts.index' => [
            'it' => 'Consente di gestire gli account (aziende principali, owner, piano licenza e limiti).',
            'en' => 'Allows managing accounts (main organizations, owners, license plans and limits).',
        ],
        'settings.license_plans.index' => [
            'it' => 'Consente di gestire i piani di licenza (limiti, prezzi, funzionalità).',
            'en' => 'Allows managing license plans (limits, pricing, features).',
        ],
        'settings.users.index' => [
            'it' => 'Consente di aprire la sezione Impostazioni per gestire gli utenti del sistema.',
            'en' => 'Allows opening Settings to manage system users.',
        ],
        'settings.roles.index' => [
            'it' => 'Consente di aprire la sezione Impostazioni per gestire i ruoli e i permessi associati.',
            'en' => 'Allows opening Settings to manage roles and their linked permissions.',
        ],
        'settings.permissions.index' => [
            'it' => 'Consente di consultare l’elenco dei permessi disponibili (sola lettura organizzata per categoria).',
            'en' => 'Allows viewing the list of available permissions (read-only, grouped by category).',
        ],
        'settings.preferences.index' => [
            'it' => 'Consente di aprire e modificare le preferenze applicative (es. sessione, fuso orario).',
            'en' => 'Allows opening and editing application preferences (e.g. session, timezone).',
        ],
        'settings.logs.index' => [
            'it' => 'Consente di consultare i log di attività e i file di log applicativi.',
            'en' => 'Allows viewing activity logs and application log files.',
        ],
        'settings.system.index' => [
            'it' => 'Consente di consultare le informazioni di sistema (PHP, server, database, Laravel).',
            'en' => 'Allows viewing system information (PHP, server, database, Laravel).',
        ],
        'settings.backup.index' => [
            'it' => 'Consente di aprire il monitor dei backup e le azioni correlate (ove configurate).',
            'en' => 'Allows opening the backup monitor and related actions (when configured).',
        ],
    ];

    public function run(): void
    {
        foreach (Permission::query()->orderBy('name')->cursor() as $permission) {
            $name = $permission->name;

            if (isset(self::COPY[$name])) {
                foreach (['it', 'en'] as $locale) {
                    PermissionDescription::query()->updateOrCreate(
                        [
                            'permission_id' => $permission->id,
                            'locale' => $locale,
                        ],
                        [
                            'description' => self::COPY[$name][$locale],
                        ],
                    );
                }

                continue;
            }

            PermissionDescription::query()->updateOrCreate(
                [
                    'permission_id' => $permission->id,
                    'locale' => 'it',
                ],
                [
                    'description' => 'Permesso applicativo: '.$name.'.',
                ],
            );

            PermissionDescription::query()->updateOrCreate(
                [
                    'permission_id' => $permission->id,
                    'locale' => 'en',
                ],
                [
                    'description' => 'Application permission: '.$name.'.',
                ],
            );
        }
    }
}
