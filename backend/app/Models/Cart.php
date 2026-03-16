<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cart extends Model
{
    use HasFactory;
    protected $table = 'carts';

    protected $fillable = [
        'user_id',
        'session_id',
        'total_price',
        'total_quantity',
        'status',
    ];

    // Một giỏ hàng thuộc về 1 user
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Một giỏ hàng có nhiều chi tiết sản phẩm
    public function cartDetails(): HasMany
    {
        return $this->hasMany(CartDetail::class);
    }
}
