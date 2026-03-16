<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Footer extends Model
{
    use HasFactory;
    protected $fillable = [
        'lang_id',
        'company',
        'support',
        'categories',
        'legal',
        'features',
        'company_description',
        'contact_address',
        'contact_phone',
        'contact_email',
        'social_facebook',
        'social_instagram',
        'social_twitter',
        'social_youtube',
        'newsletter_title',
        'newsletter_description',
        'newsletter_privacy_text',
        'bottom_copyright',
        'badges',
        'payment_methods',
        'status',
        'order',
    ];

    protected $casts = [
        'company' => 'array',
        'support' => 'array',
        'categories' => 'array',
        'legal' => 'array',
        'features' => 'array',
        'badges' => 'array',
        'payment_methods' => 'array',
    ];

    public function language()
    {
        return $this->belongsTo(Language::class, 'lang_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByLanguage($query, $langId)
    {
        return $query->where('lang_id', $langId);
    }
}
