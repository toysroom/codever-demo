<?php

namespace App\Console\Commands;

use App\Models\Member;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductPrice;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Throwable;

class ImportListinoFromXls extends Command
{
    protected $signature = 'products:import-listino
        {member_id : ID del member owner (account)}
        {--path= : Percorso assoluto o relativo al file .xls/.xlsx}
        {--list-name=Listino base : Nome del listino da creare/usare}
        {--dry-run : Solo analisi, nessuna scrittura}';

    protected $description = 'Importa da un export listino Excel (colonne tipo Codice, Categoria, Nome, Prezzo, …) in categorie, prodotti e prezzi.';

    public function handle(): int
    {
        if (! class_exists(IOFactory::class)) {
            $this->error('Esegui: composer require phpoffice/phpspreadsheet (e composer update).');

            return self::FAILURE;
        }

        $memberId = (int) $this->argument('member_id');
        $member = Member::query()->owners()->whereKey($memberId)->first();
        if (! $member) {
            $this->error("Member owner non trovato: {$memberId}");

            return self::FAILURE;
        }

        $path = $this->option('path') ?: storage_path('Listino_01-05-2026.xls');
        if (! is_readable($path)) {
            $this->error("File non leggibile: {$path}");

            return self::FAILURE;
        }

        $dry = (bool) $this->option('dry-run');

        try {
            $spreadsheet = IOFactory::load($path);
        } catch (Throwable $e) {
            $this->error('Lettura Excel fallita: '.$e->getMessage());

            return self::FAILURE;
        }

        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray(null, true, true, false);
        if ($rows === [] || $rows === null) {
            $this->error('Foglio vuoto.');

            return self::FAILURE;
        }

        $headerIndexes = $this->detectHeaderRow($rows);
        if ($headerIndexes === null) {
            $this->error('Intestazioni attese non trovate (servono colonne Codice e Categoria).');

            return self::FAILURE;
        }

        [$headerRow, $col] = $headerIndexes;
        $this->info('Intestazione trovata alla riga '.($headerRow + 1).'.');

        $listName = (string) $this->option('list-name');
        $priceList = null;
        if (! $dry) {
            $priceList = PriceList::withoutGlobalScopes()->firstOrCreate(
                [
                    'member_id' => $member->id,
                    'name' => $listName,
                ],
                [
                    'code' => 'import-'.Str::slug($listName),
                    'currency' => 'EUR',
                    'is_default' => true,
                ]
            );
        }

        $lineKind = null;
        $imported = 0;
        /** @var array<string, int> $categoriesCache */
        $categoriesCache = [];

        $processRows = function () use (
            $rows,
            $headerRow,
            $col,
            &$lineKind,
            $member,
            &$categoriesCache,
            &$imported,
            $dry,
            $priceList
        ): void {
            for ($r = $headerRow + 1; $r < count($rows); $r++) {
                $row = $rows[$r] ?? [];
                if (! is_array($row)) {
                    continue;
                }
                $cells = array_values($row);
                $first = isset($cells[0]) ? trim((string) $cells[0]) : '';
                if ($first === 'Voci di ricavo') {
                    $lineKind = 'revenue';

                    continue;
                }
                if ($first === 'Voci di vendita') {
                    $lineKind = 'sales';

                    continue;
                }

                $categoryName = $this->cell($cells, $col['categoria'] ?? null);
                $code = $this->cell($cells, $col['codice'] ?? null);
                $name = $this->cell($cells, $col['nome'] ?? null);
                if ($code === '' && $name === '' && $categoryName === '') {
                    continue;
                }
                if ($code === '' || $name === '') {
                    continue;
                }

                $invoice = $this->cell($cells, $col['invoice'] ?? null);
                $revenueCode = $this->cell($cells, $col['revenue_code'] ?? null);
                $revenueDesc = $this->cell($cells, $col['revenue_desc'] ?? null);
                $salesCode = $this->cell($cells, $col['sales_code'] ?? null);
                $salesDesc = $this->cell($cells, $col['sales_desc'] ?? null);
                $priceRaw = $col['prezzo'] !== null ? ($cells[$col['prezzo']] ?? null) : null;
                $price = $this->normalizePrice($priceRaw);

                $categoryId = null;
                if ($categoryName !== '') {
                    $ck = $member->id.'|'.$categoryName;
                    if (! isset($categoriesCache[$ck])) {
                        if ($dry) {
                            $categoriesCache[$ck] = 0;
                        } else {
                            $categoriesCache[$ck] = ProductCategory::withoutGlobalScopes()->firstOrCreate(
                                [
                                    'member_id' => $member->id,
                                    'name' => $categoryName,
                                ],
                                [
                                    'sort_order' => 0,
                                ]
                            )->id;
                        }
                    }
                    $categoryId = $categoriesCache[$ck];
                }

                if ($dry) {
                    $imported++;

                    continue;
                }

                $product = Product::withoutGlobalScopes()->updateOrCreate(
                    [
                        'member_id' => $member->id,
                        'code' => $code,
                    ],
                    [
                        'product_category_id' => $categoryId ?: null,
                        'name' => $name,
                        'invoice_text' => $invoice ?: null,
                        'revenue_code' => $revenueCode ?: null,
                        'revenue_description' => $revenueDesc ?: null,
                        'sales_code' => $salesCode ?: null,
                        'sales_description' => $salesDesc ?: null,
                        'line_kind' => $lineKind,
                        'sort_order' => $imported,
                    ]
                );

                if ($price !== null && $priceList !== null) {
                    ProductPrice::query()->updateOrCreate(
                        [
                            'product_id' => $product->id,
                            'price_list_id' => $priceList->id,
                        ],
                        [
                            'amount' => $price,
                        ]
                    );
                }

                $imported++;
            }
        };

        if ($dry) {
            $processRows();
            $this->info("[dry-run] Righe prodotto riconosciute: {$imported}");

            return self::SUCCESS;
        }

        DB::transaction($processRows);

        $this->info("Importate/aggiornate {$imported} righe prodotto per account {$member->id}.");

        return self::SUCCESS;
    }

    /**
     * @param  array<int, array<int|string, mixed>>  $rows
     * @return array{0: int, 1: array<string, int|null>}|null
     */
    protected function detectHeaderRow(array $rows): ?array
    {
        $aliases = [
            'categoria' => ['categoria'],
            'codice' => ['codice'],
            'nome' => ['nome'],
            'invoice' => ['testo in fattura', 'testo fattura'],
            'prezzo' => ['prezzo'],
            'revenue_code' => ['codice di ricavo'],
            'revenue_desc' => ['descrizione di ricavo'],
            'sales_code' => ['codice di vendita'],
            'sales_desc' => ['descrizione di vendita'],
        ];

        foreach ($rows as $i => $row) {
            if (! is_array($row)) {
                continue;
            }
            $cells = array_values($row);
            $normalized = [];
            foreach ($cells as $idx => $val) {
                $normalized[$idx] = mb_strtolower(trim((string) $val));
            }
            $flip = array_flip($normalized);

            $hasCode = isset($flip['codice']);
            $hasCat = isset($flip['categoria']);
            if (! $hasCode || ! $hasCat) {
                continue;
            }

            $col = [];
            foreach ($aliases as $key => $opts) {
                $col[$key] = null;
                foreach ($opts as $label) {
                    if (isset($flip[$label])) {
                        $col[$key] = (int) $flip[$label];
                        break;
                    }
                }
            }

            return [$i, $col];
        }

        return null;
    }

    /**
     * @param  list<mixed>  $cells
     */
    protected function cell(array $cells, ?int $idx): string
    {
        if ($idx === null) {
            return '';
        }

        return isset($cells[$idx]) ? trim((string) $cells[$idx]) : '';
    }

    protected function normalizePrice(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (is_numeric($value)) {
            return (string) $value;
        }
        $s = trim((string) $value);
        $s = str_replace(['€', ' '], '', $s);
        $s = str_replace(',', '.', $s);

        return is_numeric($s) ? $s : null;
    }
}
