<?php

namespace Database\Seeders;

use App\Models\Member;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductPrice;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Catalogo dimostrativo allineato all’export listino (struttura Categoria / Codice / Nome / testo fattura / prezzi).
 * Destinato all’account demo {@see DemoMemberOwnerSeeder} (email info@toysroom.it), altrimenti al primo owner.
 */
class ListinoProductsSeeder extends Seeder
{
    public function run(): void
    {
        $member = Member::query()
            ->owners()
            ->whereHas('user', fn ($q) => $q->where('email', 'info@toysroom.it'))
            ->first()
            ?? Member::query()->owners()->orderBy('id')->first();

        if (! $member) {
            $this->command?->warn('ListinoProductsSeeder: nessun member owner trovato, skip.');

            return;
        }

        /**
         * @var list<array{
         *     category: string,
         *     code: string,
         *     name: string,
         *     invoice_text: string|null,
         *     revenue_code: string|null,
         *     revenue_description: string|null,
         *     sales_code: string|null,
         *     sales_description: string|null,
         *     line_kind: string|null,
         *     price: string,
         * }> $catalog
         */
        $catalog = [
            [
                'category' => 'Burocrazia',
                'code' => 'PRIVACY-011',
                'name' => 'Privacy policy e cookie policy in 1 lingua - base',
                'invoice_text' => 'Privacy policy e cookie policy in 1 lingua',
                'revenue_code' => null,
                'revenue_description' => null,
                'sales_code' => null,
                'sales_description' => null,
                'line_kind' => 'revenue',
                'price' => '190.0000',
            ],
            [
                'category' => 'Docenza',
                'code' => 'DOCENZA-01',
                'name' => 'Servizio docenza',
                'invoice_text' => null,
                'revenue_code' => null,
                'revenue_description' => null,
                'sales_code' => null,
                'sales_description' => null,
                'line_kind' => 'revenue',
                'price' => '350.0000',
            ],
            [
                'category' => 'Domini',
                'code' => 'DOMINIO-01',
                'name' => 'Mantenimento dominio - base',
                'invoice_text' => 'Mantenimento dominio',
                'revenue_code' => null,
                'revenue_description' => null,
                'sales_code' => null,
                'sales_description' => null,
                'line_kind' => 'revenue',
                'price' => '45.0000',
            ],
            [
                'category' => 'Domini',
                'code' => 'DOMINIO-02',
                'name' => 'Mantenimento dominio - offerta',
                'invoice_text' => 'Mantenimento dominio - offerta',
                'revenue_code' => null,
                'revenue_description' => null,
                'sales_code' => null,
                'sales_description' => null,
                'line_kind' => 'revenue',
                'price' => '39.0000',
            ],
            [
                'category' => 'Domini',
                'code' => 'DOMINIO-03',
                'name' => 'Mantenimento dominio - pacchetto',
                'invoice_text' => 'Mantenimento dominio - pacchetto',
                'revenue_code' => null,
                'revenue_description' => null,
                'sales_code' => null,
                'sales_description' => null,
                'line_kind' => 'revenue',
                'price' => '99.0000',
            ],
            [
                'category' => 'Email',
                'code' => 'EMAIL-01',
                'name' => 'Casella di posta professionale - base',
                'invoice_text' => 'Casella di posta professionale',
                'revenue_code' => null,
                'revenue_description' => null,
                'sales_code' => null,
                'sales_description' => null,
                'line_kind' => 'sales',
                'price' => '60.0000',
            ],
            [
                'category' => 'Email',
                'code' => 'EMAIL-02',
                'name' => 'Casella di posta professionale - offerta',
                'invoice_text' => 'Casella di posta professionale - offerta',
                'revenue_code' => null,
                'revenue_description' => null,
                'sales_code' => null,
                'sales_description' => null,
                'line_kind' => 'sales',
                'price' => '48.0000',
            ],
            [
                'category' => 'Hosting',
                'code' => 'HOSTING-01',
                'name' => 'Pacchetto hosting con manutenzione - base',
                'invoice_text' => 'Hosting professionale, backup giornalieri, HTTPS, statistiche e manutenzione ordinaria',
                'revenue_code' => null,
                'revenue_description' => null,
                'sales_code' => null,
                'sales_description' => null,
                'line_kind' => 'sales',
                'price' => '420.0000',
            ],
            [
                'category' => 'Hosting',
                'code' => 'HOSTING-02',
                'name' => 'Pacchetto hosting senza manutenzione - base',
                'invoice_text' => 'Hosting professionale, backup giornalieri, HTTPS, statistiche',
                'revenue_code' => null,
                'revenue_description' => null,
                'sales_code' => null,
                'sales_description' => null,
                'line_kind' => 'sales',
                'price' => '280.0000',
            ],
            [
                'category' => 'PEC',
                'code' => 'PEC-01',
                'name' => 'Mantenimento pec - base',
                'invoice_text' => 'Mantenimento pec',
                'revenue_code' => null,
                'revenue_description' => null,
                'sales_code' => null,
                'sales_description' => null,
                'line_kind' => 'revenue',
                'price' => '55.0000',
            ],
            [
                'category' => 'Sviluppo Mobile',
                'code' => 'SVILUPPO-01',
                'name' => 'Realizzazione mobile app ibrida',
                'invoice_text' => null,
                'revenue_code' => null,
                'revenue_description' => null,
                'sales_code' => null,
                'sales_description' => null,
                'line_kind' => 'other',
                'price' => '4500.0000',
            ],
            [
                'category' => 'Sviluppo Mobile',
                'code' => 'SVILUPPO-02',
                'name' => 'Realizzazione mobile app nativa',
                'invoice_text' => null,
                'revenue_code' => null,
                'revenue_description' => null,
                'sales_code' => null,
                'sales_description' => null,
                'line_kind' => 'other',
                'price' => '7800.0000',
            ],
            [
                'category' => 'Sviluppo web',
                'code' => 'WEB-01',
                'name' => 'Progettazione e sviluppo sito web su misura',
                'invoice_text' => null,
                'revenue_code' => null,
                'revenue_description' => null,
                'sales_code' => null,
                'sales_description' => null,
                'line_kind' => 'other',
                'price' => '3200.0000',
            ],
        ];

        DB::transaction(function () use ($member, $catalog): void {
            $priceList = PriceList::withoutGlobalScopes()->updateOrCreate(
                [
                    'member_id' => $member->id,
                    'name' => 'Listino base',
                ],
                [
                    'code' => 'LISTINO-BASE',
                    'currency' => 'EUR',
                    'valid_from' => null,
                    'valid_to' => null,
                    'is_default' => true,
                    'notes' => 'Seed da ListinoProductsSeeder (export listino 01-05-2026).',
                ]
            );

            $categoryIds = [];

            foreach ($catalog as $sort => $row) {
                $catName = $row['category'];
                if (! isset($categoryIds[$catName])) {
                    $categoryIds[$catName] = ProductCategory::withoutGlobalScopes()->updateOrCreate(
                        [
                            'member_id' => $member->id,
                            'name' => $catName,
                        ],
                        [
                            'parent_id' => null,
                            'sort_order' => count($categoryIds),
                        ]
                    )->id;
                }

                $product = Product::withoutGlobalScopes()->updateOrCreate(
                    [
                        'member_id' => $member->id,
                        'code' => $row['code'],
                    ],
                    [
                        'product_category_id' => $categoryIds[$catName],
                        'name' => $row['name'],
                        'invoice_text' => $row['invoice_text'],
                        'revenue_code' => $row['revenue_code'],
                        'revenue_description' => $row['revenue_description'],
                        'sales_code' => $row['sales_code'],
                        'sales_description' => $row['sales_description'],
                        'line_kind' => $row['line_kind'],
                        'sort_order' => $sort,
                    ]
                );

                ProductPrice::query()->updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'price_list_id' => $priceList->id,
                    ],
                    [
                        'amount' => $row['price'],
                    ]
                );
            }
        });

        $this->command?->info("ListinoProductsSeeder: catalogo aggiornato per member #{$member->id} ({$member->company_name}).");
    }
}
