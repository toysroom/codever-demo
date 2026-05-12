<?php

namespace Database\Seeders;

use App\Models\LicensePlan;
use Illuminate\Database\Seeder;

class LicensePlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (LicensePlan::query()->where('slug', 'professional')->exists()
            && ! LicensePlan::query()->where('slug', 'premium')->exists()) {
            LicensePlan::query()->where('slug', 'professional')->update([
                'slug' => 'premium',
                'name' => 'Premium',
                'package_tier' => 'premium',
            ]);
        }

        $plans = [
            [
                'name' => 'Free',
                'slug' => 'free',
                'package_tier' => null,
                'description' => 'Piano gratuito con funzionalità base',
                'price' => null,
                'billing_period' => null,
                'annual_term_months' => 12,
                'trial_days' => 0,
                'max_customers' => 5,
                'max_sub_members' => 1,
                'features' => [
                    'Funzionalità base',
                    '5 customers max',
                    '1 sub-member max',
                    'Supporto email',
                ],
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Basic',
                'slug' => 'basic',
                'package_tier' => 'basic',
                'description' => 'Piano Basic: rinnovo annuale, costo e limiti intermedi',
                'price' => 290.00,
                'billing_period' => 'yearly',
                'annual_term_months' => 12,
                'trial_days' => 14,
                'max_customers' => 50,
                'max_sub_members' => 3,
                'features' => [
                    'Tutte le funzionalità Free',
                    '50 customers max',
                    '3 sub-members max',
                    'Export dati',
                    'Supporto prioritario',
                ],
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Premium',
                'slug' => 'premium',
                'package_tier' => 'premium',
                'description' => 'Piano Premium: funzionalità avanzate e rinnovo annuale',
                'price' => 790.00,
                'billing_period' => 'yearly',
                'annual_term_months' => 12,
                'trial_days' => 14,
                'max_customers' => 200,
                'max_sub_members' => 10,
                'features' => [
                    'Tutte le funzionalità Basic',
                    '200 customers max',
                    '10 sub-members max',
                    'API access',
                    'Report avanzati',
                    'Integrazioni',
                ],
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'package_tier' => 'enterprise',
                'description' => 'Piano Enterprise con limiti elevati e supporto dedicato',
                'price' => 1990.00,
                'billing_period' => 'yearly',
                'annual_term_months' => 12,
                'trial_days' => 14,
                'max_customers' => null,
                'max_sub_members' => null,
                'features' => [
                    'Tutte le funzionalità Premium',
                    'Customers illimitati',
                    'Sub-members illimitati',
                    'API avanzate',
                    'Supporto dedicato 24/7',
                    'Onboarding personalizzato',
                    'Custom integrations',
                ],
                'is_active' => true,
                'sort_order' => 4,
            ],
        ];

        foreach ($plans as $plan) {
            LicensePlan::updateOrCreate(
                ['slug' => $plan['slug']],
                $plan
            );
        }
    }
}
