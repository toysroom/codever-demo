<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Member;
use App\Models\Module;
use App\Models\Role;
use App\Models\User;
use App\Models\WebDomain;
use App\Models\WebDomainFtpAccount;
use App\Models\WebHostingProvider;
use App\Models\WebServer;
use App\Modules\Web\Support\WebDomainUrlNormalizer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Compagnie Toysroom + cliente + dominio di esempio (modulo Web).
 */
class ToysroomDataSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        /** @var User|null $ownerUser */
        $ownerUser = User::withoutGlobalScopes()->where('email', 'info@toysroom.it')->first();
        if (! $ownerUser?->member) {
            $this->command?->warn('ToysroomDataSeeder: nessun member per info@toysroom.it — eseguire DemoMemberOwnerSeeder.');

            return;
        }

        /** @var Member $member */
        $member = $ownerUser->member;

        $companyDefs = ['Videoproduction', 'Markora', 'Toysroom'];

        foreach ($companyDefs as $name) {
            Company::withoutGlobalScopes()->updateOrCreate(
                [
                    'member_id' => $member->id,
                    'name' => $name,
                ],
                [
                    'is_default' => $name === 'Toysroom',
                ]
            );
        }

        $customerUser = User::withoutGlobalScopes()->updateOrCreate(
            ['email' => 'progetto.nuoviocchi@toysroom.seed'],
            [
                'name' => 'Progetto Nuovi Occhi Mugello',
                'password' => Hash::make('pippo'),
                'user_type' => 'customer',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $custRole = Role::query()->where('name', 'customer')->first();
        if ($custRole && ! $customerUser->hasRole('customer')) {
            $customerUser->syncRoles(['customer']);
        }

        Customer::withoutGlobalScopes()->updateOrCreate(
            ['user_id' => $customerUser->id],
            [
                'member_id' => $member->id,
                'first_name' => 'Nuovi occhi',
                'last_name' => 'sul Mugello',
                'company_name' => 'Nuovi Occhi Mugello',
                'phone' => null,
                'address' => null,
            ]
        );

        /** @var Customer|null $customer */
        $customer = Customer::withoutGlobalScopes()->where('user_id', $customerUser->id)->first();
        /** @var Company|null $companyToysroom */
        $companyToysroom = Company::withoutGlobalScopes()->where('member_id', $member->id)->where('name', 'Toysroom')->first();

        if (! $customer || ! $companyToysroom) {
            $this->command?->error('ToysroomDataSeeder: customer o società Toysroom mancante.');

            return;
        }

        $canonicalUrl = WebDomainUrlNormalizer::normalizeStoredUrl('http://www.nuoviocchisulmugello.it');

        WebDomain::withoutGlobalScopes()->updateOrCreate(
            [
                'member_id' => $member->id,
                'hostname' => $canonicalUrl,
            ],
            [
                'customer_id' => $customer->id,
                'company_id' => $companyToysroom->id,
                'notes' => null,
            ]
        );

        /** @var WebDomain|null $nuoviOcchiDomain */
        $nuoviOcchiDomain = WebDomain::withoutGlobalScopes()
            ->where('member_id', $member->id)
            ->where('hostname', $canonicalUrl)
            ->first();

        if ($nuoviOcchiDomain) {
            WebDomainFtpAccount::query()->updateOrCreate(
                [
                    'web_domain_id' => $nuoviOcchiDomain->id,
                    'host' => '46.30.245.111',
                    'username' => 'nu345oc4mug56456',
                ],
                [
                    'label' => 'FTP Serverplan (nuoviocchisulmugello)',
                    'protocol' => 'ftp',
                    'port' => 21,
                    'password' => 'AUTGd_pZ[G04',
                    'remote_base_path' => 'public_html',
                    'is_default' => true,
                    'notes' => 'Credenziali demo da ToysroomDataSeeder.',
                ],
            );
        }

        $serverplanProviderId = WebHostingProvider::query()->where('slug', 'serverplan')->value('id');
        if ($serverplanProviderId) {
            WebServer::withoutGlobalScopes()->updateOrCreate(
                [
                    'member_id' => $member->id,
                    'host' => '46.30.245.111',
                ],
                [
                    'web_hosting_provider_id' => (int) $serverplanProviderId,
                    'label' => null,
                    'notes' => null,
                ],
            );

            WebServer::withoutGlobalScopes()->updateOrCreate(
                [
                    'member_id' => $member->id,
                    'host' => '89.46.226.31',
                ],
                [
                    'web_hosting_provider_id' => (int) $serverplanProviderId,
                    'label' => null,
                    'notes' => null,
                ],
            );
        } else {
            $this->command?->warn('ToysroomDataSeeder: provider serverplan assente — eseguire WebHostingProvidersCatalogSeeder prima di ToysroomDataSeeder.');
        }

        $webModule = Module::query()->where('slug', 'web')->first();
        if ($webModule) {
            $member->modules()->syncWithoutDetaching([
                $webModule->id => [
                    'status' => 'active',
                    'starts_at' => now(),
                    'ends_at' => null,
                ],
            ]);
        }
    }
}
