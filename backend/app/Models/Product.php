<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;
    protected $fillable = [
        'lang_id',
        'name',
        'desc',
        'content',
        'image',
        'attribute',
        'url',
        'author',
        'seotitle',
        'seodesc',
        'price',
        'saleprice',
        'totalview',
        'order',
        'lastview',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'saleprice' => 'decimal:2',
        'lastview' => 'datetime',
    ];

    // Quan hệ với ngôn ngữ
    public function language()
    {
        return $this->belongsTo(Language::class, 'lang_id');
    }

    // Quan hệ với sub_products
    public function subProducts()
    {
        return $this->hasMany(SubProduct::class, 'product_id');
    }

    // Quan hệ với categories
    public function categories()
    {
        return $this->belongsToMany(Category::class, 'product_categories', 'product_id', 'category_id')
            ->withTimestamps();
    }

    // Quan hệ với reviews
    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function approvedReviews()
    {
        return $this->hasMany(Review::class)->approved();
    }

    // Tính toán rating trung bình
    public function getAverageRatingAttribute()
    {
        return Review::getAverageRating($this->id);
    }

    public function getTotalReviewsAttribute()
    {
        return Review::getTotalReviews($this->id);
    }

    public function getRatingDistributionAttribute()
    {
        return Review::getRatingDistribution($this->id);
    }

    // Kiểm tra user đã review sản phẩm này chưa
    public function hasUserReviewed($userId)
    {
        return Review::userHasReviewed($userId, $this->id);
    }

    // Lấy review của user cho sản phẩm này
    public function getUserReview($userId)
    {
        return Review::getUserReview($userId, $this->id);
    }
}
