<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PromotionSubscriber extends Model
{
    use HasFactory;
    protected $table = 'promotion_subscribers';

    protected $fillable = [
        'email',
        'status',
        'subscribed_at',
    ];

    protected $casts = [
        'status' => 'string',
        'subscribed_at' => 'datetime',
    ];
}
