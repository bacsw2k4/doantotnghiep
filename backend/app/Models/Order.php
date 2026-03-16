<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;
    protected $table = 'orders';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $casts = [
        'createdate' => 'datetime',
        'updatedate' => 'datetime',
        'enddate' => 'datetime',
    ];

    protected $fillable = [
        'author',
        'shippingaddress_id',
        'discount_price',
        'voucher_code',
        'discount_percent',
        'total_price',
        'discount_total_price',
        'createdate',
        'updatedate',
        'enddate',
        'status',
        'language_id'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'author');
    }

    public function shippingAddress()
    {
        return $this->belongsTo(ShippingAddress::class, 'shippingaddress_id');
    }

    public function voucher()
    {
        return $this->belongsTo(Voucher::class, 'voucher_code', 'code');
    }

    public function language()
    {
        return $this->belongsTo(Language::class, 'language_id');
    }

    public function orderDetails()
    {
        return $this->hasMany(OrderDetail::class, 'orders_id');
    }

    public function statusHistories()
    {
        return $this->hasMany(OrderStatusHistory::class, 'order_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function latestPayment()
    {
        return $this->hasOne(Payment::class)->latest();
    }
}