<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CartDetail extends Model
{
    use HasFactory;
    protected $table = 'cart_details';

    protected $fillable = [
        'cart_id',
        'product_id',
        'quantity',
        'price',
        'total_price',
    ];

    // Một chi tiết giỏ hàng thuộc về 1 giỏ hàng
    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }

    // Một chi tiết giỏ hàng liên kết đến 1 sản phẩm
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Một chi tiết giỏ hàng có nhiều thuộc tính
    public function attributes()
    {
        return $this->belongsToMany(Attribute::class, 'cart_detail_attributes', 'cart_detail_id', 'attribute_id')
            ->withPivot('attribute_id');
    }
}
