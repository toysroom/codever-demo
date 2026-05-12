<?php

namespace App\Modules\Products\Caching;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class PaginatedCacheReadResult
{
    public function __construct(
        public readonly LengthAwarePaginator $paginator,
        public readonly string $dataSource,
    ) {
        if ($dataSource !== 'redis' && $dataSource !== 'database') {
            throw new \InvalidArgumentException('dataSource must be redis or database.');
        }
    }
}
