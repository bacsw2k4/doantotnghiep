<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Language extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'image',
        'desc',
        'order',
        'status',
    ];

    // Quan hệ 1-n: Một ngôn ngữ có nhiều language_items
    public function items()
    {
        return $this->hasMany(LanguageItem::class, 'language_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
