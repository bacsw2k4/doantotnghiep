<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LanguageItem extends Model
{
    use HasFactory;
    protected $fillable = [
        'language_id',
        'language_key_id',
        'title',
        'desc',
        'status',
    ];

    // Một item thuộc về 1 ngôn ngữ
    public function language()
    {
        return $this->belongsTo(Language::class, 'language_id');
    }

    // Một item thuộc về 1 key
    public function languageKey()
    {
        return $this->belongsTo(LanguageKey::class, 'language_key_id');
    }
}
