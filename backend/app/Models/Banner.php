<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Banner extends Model
{
    use HasFactory;
    protected $fillable = [
        'lang_id',
        'title',
        'subtitle',
        'description',
        'image',
        'cta_text',
        'cta_link',
        'badge',
        'theme',
        'order',
        'status',
    ];

    protected $casts = [
        'status' => 'string',
        'theme' => 'string',
    ];

    protected $dates = ['created_at', 'updated_at'];

    /**
     * Quan hệ với bảng ngôn ngữ
     */
    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class, 'lang_id');
    }

    /**
     * Scope: chỉ lấy banner đang active
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope: lọc banner theo ngôn ngữ
     */
    public function scopeByLanguage($query, $langId)
    {
        return $query->where('lang_id', $langId);
    }
}
