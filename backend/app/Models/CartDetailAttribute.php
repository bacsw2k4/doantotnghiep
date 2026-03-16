<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CartDetailAttribute extends Model
{
    use HasFactory;
    protected $table = 'cart_detail_attributes';

    protected $fillable = [
        'cart_detail_id',
        'attribute_id',
    ];

    // Một thuộc tính chi tiết giỏ hàng thuộc về 1 chi tiết giỏ hàng
    public function cartDetail()
    {
        return $this->belongsTo(CartDetail::class, 'cart_detail_id');
    }

    // Thuộc tính liên kết với bảng attribute
    public function attribute()
    {
        return $this->belongsTo(Attribute::class);
    }
}
