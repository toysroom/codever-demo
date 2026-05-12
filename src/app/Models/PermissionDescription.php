<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Permission\Models\Permission;

class PermissionDescription extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'permission_id',
        'locale',
        'description',
    ];

    /**
     * @return BelongsTo<Permission, $this>
     */
    public function permission(): BelongsTo
    {
        return $this->belongsTo(Permission::class);
    }
}
