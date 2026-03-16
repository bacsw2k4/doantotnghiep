<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;
    protected $fillable = [
        'lang_id',
        'name',
        'desc',
        'content',
        'seotitle',
        'seodesc',
        'url',
        'image',
        'attribute',
        'order',
        'status',
    ];

    protected $dates = ['createdate', 'updatedate'];

    // Liên kết với ngôn ngữ
    public function language()
    {
        return $this->belongsTo(Language::class, 'lang_id');
    }

    // Quan hệ many-to-many: Category có nhiều products
    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_categories', 'category_id', 'product_id')
            ->withTimestamps()
            ->withPivot('enddate');
    }
}
