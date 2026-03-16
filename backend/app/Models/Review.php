<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Review extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_id',
        'user_id',
        'rating',
        'comment',
        'is_verified_purchase',
        'status',
        'has_reply',
        'rejection_reason',
    ];

    protected $casts = [
        'rating' => 'integer',
        'is_verified_purchase' => 'boolean',
        'has_reply' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'rejection_reason' => 'string',
    ];

    // Quan hệ với sản phẩm
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Quan hệ với người dùng
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Quan hệ với replies
    public function replies()
    {
        return $this->hasMany(ReviewReply::class);
    }

    // Scope cho các trạng thái
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    // Lọc theo rating
    public function scopeRating($query, $rating)
    {
        if ($rating && $rating >= 1 && $rating <= 5) {
            return $query->where('rating', $rating);
        }
        return $query;
    }

    // Sắp xếp
    public function scopeSortBy($query, $sort = 'latest')
    {
        switch ($sort) {
            case 'highest':
                return $query->orderBy('rating', 'DESC');
            case 'lowest':
                return $query->orderBy('rating', 'ASC');
            case 'oldest':
                return $query->orderBy('created_at', 'ASC');
            case 'latest':
            default:
                return $query->orderBy('created_at', 'DESC');
        }
    }

    // Tính điểm trung bình rating
    public static function getAverageRating($productId)
    {
        return (float) self::where('product_id', $productId)
            ->approved()
            ->avg('rating') ?? 0;
    }

    // Tổng số review
    public static function getTotalReviews($productId)
    {
        return self::where('product_id', $productId)
            ->approved()
            ->count();
    }

    // Phân phối rating
    public static function getRatingDistribution($productId)
    {
        $distribution = self::where('product_id', $productId)
            ->approved()
            ->selectRaw('rating, COUNT(*) as count')
            ->groupBy('rating')
            ->orderBy('rating', 'DESC')
            ->get()
            ->keyBy('rating');

        $result = [];
        for ($i = 5; $i >= 1; $i--) {
            $result[] = [
                'rating' => $i,
                'count' => $distribution[$i]->count ?? 0
            ];
        }

        return $result;
    }

    // Kiểm tra user đã review sản phẩm này chưa
    public static function userHasReviewed($userId, $productId)
    {
        return self::where('user_id', $userId)
            ->where('product_id', $productId)
            ->exists();
    }

    // Kiểm tra user đã mua sản phẩm
    public static function userHasPurchased($userId, $productId)
    {
        return OrderDetail::whereHas('order', function ($query) use ($userId) {
            $query->where('author', $userId)
                ->where('status', 'delivered');
        })
            ->where('product_id', $productId)
            ->exists();
    }
    // Lấy review của user cho sản phẩm
    public static function getUserReview($userId, $productId)
    {
        return self::where('user_id', $userId)
            ->where('product_id', $productId)
            ->first();
    }

    // Format ngày tháng
    public function getFormattedDateAttribute()
    {
        return $this->created_at->format('d/m/Y H:i');
    }

    // Kiểm tra có thể chỉnh sửa không (trong vòng 24h)
    public function canEdit()
    {
        return $this->created_at->diffInHours(now()) <= 24;
    }
}
