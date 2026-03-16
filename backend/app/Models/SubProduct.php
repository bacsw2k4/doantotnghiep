<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubProduct extends Model
{
    use HasFactory;
    protected $fillable = [
        'product_id',
        'title',
        'content',
        'image',
        'author',
        'url',
        'status',
    ];


    // Quan hệ thuộc về 1 product
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
