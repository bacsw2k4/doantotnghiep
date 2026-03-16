<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Menu extends Model
{
    use HasFactory;
    protected $fillable = [
        'lang_id',
        'parentid',
        'parentsid',
        'name',
        'desc',
        'content',
        'seotitle',
        'seodesc',
        'url',
        'params',
        'order',
        'status',
    ];

    // Ép kiểu dữ liệu
    protected $casts = [
        'params' => 'array',
        'status' => 'string',
    ];

    // Các cột kiểu ngày
    protected $dates = ['createdate', 'updatedate'];

    /**
     * Quan hệ với bảng ngôn ngữ
     */
    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class, 'lang_id');
    }

    /**
     * Quan hệ menu cha
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Menu::class, 'parentid');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Menu::class, 'parentid', 'id')
            ->where('status', 'active')
            ->with(['children' => function ($query) {
                $query->where('status', 'active')->orderBy('order');
            }])
            ->orderBy('order');
    }

    /**
     * Scope: chỉ lấy menu đang active
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope: lọc menu theo ngôn ngữ
     */
    public function scopeByLanguage($query, $langId)
    {
        return $query->where('lang_id', $langId);
    }
}
