<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShippingAddress extends Model
{
    use HasFactory;
    protected $table = 'shipping_addresses';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'address',
        'phone',
        'desc',
        'email',
        'name',
        'country',
        'city',
        'is_default',
        'createdate',
        'updatedate',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}