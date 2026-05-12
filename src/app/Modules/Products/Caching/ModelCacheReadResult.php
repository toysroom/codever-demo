<?php

namespace App\Modules\Products\Caching;

final class ModelCacheReadResult
{
    public function __construct(
        public readonly mixed $model,
        public readonly string $dataSource,
    ) {
        if ($dataSource !== 'redis' && $dataSource !== 'database') {
            throw new \InvalidArgumentException('dataSource must be redis or database.');
        }
    }
}
