<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    use HasFactory;
    protected $fillable = [
        'code',
        'name',
        'image',
        'type',
        'discount',
        'minmoney',
        'status',
        'createdate',
        'updatedate',
        'enddate',
    ];

    protected $casts = [
        'createdate' => 'datetime',
        'updatedate' => 'datetime',
        'enddate' => 'datetime',
    ];
}
