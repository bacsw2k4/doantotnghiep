<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderDetailAttribute extends Model
{
    use HasFactory;
    protected $table = 'order_details_attributes';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = ['order_details_id', 'attribute_id'];

    public function orderDetail()
    {
        return $this->belongsTo(OrderDetail::class, 'order_details_id');
    }

    public function attribute()
    {
        return $this->belongsTo(Attribute::class, 'attribute_id');
    }
}
