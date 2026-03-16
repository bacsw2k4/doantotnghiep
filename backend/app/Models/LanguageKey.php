<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LanguageKey extends Model
{
    use HasFactory;
    protected $fillable = [
        'title',
        'desc',
    ];

    // Quan hệ 1-n: Một key có nhiều language_items
    public function items()
    {
        return $this->hasMany(LanguageItem::class, 'language_key_id');
    }
}
