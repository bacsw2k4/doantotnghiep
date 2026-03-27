<?php

namespace App\Http\Controllers\Shopping;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    /**
     * Lấy danh sách review của sản phẩm (public - không cần đăng nhập)
     */
    public function getProductReviews($productId, Request $request)
    {
        $validator = Validator::make(['product_id' => $productId], [
            'product_id' => 'required|exists:products,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Sản phẩm không tồn tại',
                'errors' => $validator->errors()
            ], 404);
        }

        $sort = $request->get('sort', 'latest');
        $rating = $request->get('rating');
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 10);

        $query = Review::where('product_id', $productId)
            ->approved()
            ->with(['user', 'replies.user'])
            ->sortBy($sort)
            ->rating($rating);

        $reviews = $query->paginate($perPage, ['*'], 'page', $page);

        // Format dữ liệu trả về
        $formattedReviews = $reviews->map(function ($review) {
            return [
                'id' => $review->id,
                'rating' => $review->rating,
                'comment' => $review->comment,
                'is_verified_purchase' => $review->is_verified_purchase,
                'created_at' => $review->created_at->format('d/m/Y H:i'),
                'user' => [
                    'id' => $review->user->id,
                    'name' => $review->user->firstname . ' ' . $review->user->lastname,
                    'avatar' => $review->user->avatar,
                ],
                'replies' => $review->replies->map(function ($reply) {
                    return [
                        'id' => $reply->id,
                        'content' => $reply->reply_content,
                        'created_at' => $reply->created_at->format('d/m/Y H:i'),
                        'user' => [
                            'id' => $reply->user->id,
                            'name' => $reply->user->firstname . ' ' . $reply->user->lastname,
                            'avatar' => $reply->user->avatar,
                        ]
                    ];
                }),
                'can_edit' => Auth::check() && $review->user_id == Auth::id() && $review->canEdit(),
                'can_delete' => Auth::check() && $review->user_id == Auth::id(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formattedReviews,
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
                'last_page' => $reviews->lastPage(),
                'from' => $reviews->firstItem(),
                'to' => $reviews->lastItem(),
            ]
        ]);
    }

    /**
     * Lấy thống kê rating của sản phẩm (public)
     */
    public function getProductRatingStats($productId)
    {
        $validator = Validator::make(['product_id' => $productId], [
            'product_id' => 'required|exists:products,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Sản phẩm không tồn tại',
                'errors' => $validator->errors()
            ], 404);
        }

        $averageRating = Review::getAverageRating($productId);
        $totalReviews = Review::getTotalReviews($productId);
        $ratingDistribution = Review::getRatingDistribution($productId);

        return response()->json([
            'success' => true,
            'data' => [
                'average_rating' => round($averageRating, 1),
                'total_reviews' => $totalReviews,
                'rating_distribution' => $ratingDistribution,
            ]
        ]);
    }

    /**
     * Tạo review mới (cần đăng nhập)
     */
    public function createReview(Request $request, $productId)
    {
        $validator = Validator::make(array_merge($request->all(), ['product_id' => $productId]), [
            'product_id' => 'required|exists:products,id',
            'rating' => 'required|integer|between:1,5',
            'comment' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        $userId = Auth::id();
        $product = Product::find($productId);

        // Kiểm tra đã review chưa
        if (Review::userHasReviewed($userId, $productId)) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn đã đánh giá sản phẩm này rồi'
            ], 400);
        }

        // Kiểm tra đã mua hàng chưa (verified purchase)
        $isVerifiedPurchase = Review::userHasPurchased($userId, $productId);

        // Tạo review
        $review = Review::create([
            'product_id' => $productId,
            'user_id' => $userId,
            'rating' => $request->rating,
            'comment' => $request->comment,
            'is_verified_purchase' => $isVerifiedPurchase,
            'status' => config('app.auto_approve_reviews', false) ? 'approved' : 'pending',
        ]);

        $review->load('user');

        $responseData = [
            'id' => $review->id,
            'rating' => $review->rating,
            'comment' => $review->comment,
            'is_verified_purchase' => $review->is_verified_purchase,
            'status' => $review->status,
            'created_at' => $review->created_at->format('d/m/Y H:i'),
            'user' => [
                'id' => $review->user->id,
                'name' => $review->user->firstname . ' ' . $review->user->lastname,
                'avatar' => $review->user->avatar,
            ],
            'can_edit' => true,
            'can_delete' => true,
        ];

        return response()->json([
            'success' => true,
            'message' => config('app.auto_approve_reviews', false)
                ? 'Đánh giá của bạn đã được gửi thành công.'
                : 'Đánh giá của bạn đang chờ duyệt.',
            'data' => $responseData
        ], 201);
    }

    /**
     * Cập nhật review của user (cần đăng nhập)
     */
    public function updateReview(Request $request, $id)
    {
        $review = Review::find($id);

        if (!$review) {
            return response()->json([
                'success' => false,
                'message' => 'Review không tồn tại'
            ], 404);
        }

        // Kiểm tra quyền sở hữu
        if ($review->user_id != Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền chỉnh sửa review này'
            ], 403);
        }

        // Kiểm tra thời gian chỉnh sửa (24h)
        if (!$review->canEdit()) {
            return response()->json([
                'success' => false,
                'message' => 'Chỉ có thể chỉnh sửa review trong vòng 24 giờ'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'rating' => 'sometimes|integer|between:1,5',
            'comment' => 'sometimes|nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        // CẬP NHẬT VỚI STATUS MỚI VÀ RESET REJECTION REASON
        $review->update([
            'rating' => $request->input('rating', $review->rating),
            'comment' => $request->input('comment', $review->comment),
            'status' => config('app.auto_approve_reviews', false) ? 'approved' : 'pending',
            'rejection_reason' => null, // Reset lý do từ chối
        ]);

        $review->load(['user', 'replies.user']);

        $responseData = [
            'id' => $review->id,
            'rating' => $review->rating,
            'comment' => $review->comment,
            'is_verified_purchase' => $review->is_verified_purchase,
            'status' => $review->status,
            'created_at' => $review->created_at->format('d/m/Y H:i'),
            'user' => [
                'id' => $review->user->id,
                'name' => $review->user->firstname . ' ' . $review->user->lastname,
                'avatar' => $review->user->avatar,
            ],
            'replies' => $review->replies->map(function ($reply) {
                return [
                    'id' => $reply->id,
                    'content' => $reply->reply_content,
                    'created_at' => $reply->created_at->format('d/m/Y H:i'),
                    'user' => [
                        'id' => $reply->user->id,
                        'name' => $reply->user->firstname . ' ' . $reply->user->lastname,
                        'avatar' => $reply->user->avatar,
                    ]
                ];
            }),
            'can_edit' => $review->canEdit(),
            'can_delete' => true,
        ];

        return response()->json([
            'success' => true,
            'message' => config('app.auto_approve_reviews', false)
                ? 'Cập nhật review thành công'
                : 'Review đã được cập nhật và đang chờ duyệt',
            'data' => $responseData
        ]);
    }
    /**
     * Xóa review của user (cần đăng nhập)
     */
    public function deleteReview($id)
    {
        $review = Review::find($id);

        if (!$review) {
            return response()->json([
                'success' => false,
                'message' => 'Review không tồn tại'
            ], 404);
        }

        // Kiểm tra quyền sở hữu
        if ($review->user_id != Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền xóa review này'
            ], 403);
        }

        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa review thành công'
        ]);
    }

    /**
     * Lấy review của user cho sản phẩm (cần đăng nhập)
     */
    public function getUserProductReview($productId)
    {
        $validator = Validator::make(['product_id' => $productId], [
            'product_id' => 'required|exists:products,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Sản phẩm không tồn tại',
                'errors' => $validator->errors()
            ], 404);
        }

        $userId = Auth::id();
        $review = Review::getUserReview($userId, $productId);

        if (!$review) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn chưa đánh giá sản phẩm này'
            ], 404);
        }

        $review->load(['user', 'replies.user']);

        $responseData = [
            'id' => $review->id,
            'rating' => $review->rating,
            'comment' => $review->comment,
            'is_verified_purchase' => $review->is_verified_purchase,
            'status' => $review->status,
            'created_at' => $review->created_at->format('d/m/Y H:i'),
            'user' => [
                'id' => $review->user->id,
                'name' => $review->user->firstname . ' ' . $review->user->lastname,
                'avatar' => $review->user->avatar,
            ],
            'replies' => $review->replies->map(function ($reply) {
                return [
                    'id' => $reply->id,
                    'content' => $reply->reply_content,
                    'created_at' => $reply->created_at->format('d/m/Y H:i'),
                    'user' => [
                        'id' => $reply->user->id,
                        'name' => $reply->user->firstname . ' ' . $reply->user->lastname,
                        'avatar' => $reply->user->avatar,
                    ]
                ];
            }),
            'can_edit' => $review->canEdit(),
            'can_delete' => true,
        ];

        return response()->json([
            'success' => true,
            'data' => $responseData
        ]);
    }

    /**
     * Kiểm tra user có thể review sản phẩm không (đã mua hàng, chưa review)
     */
    public function canReviewProduct($productId)
    {
        $userId = Auth::id();

        $validator = Validator::make(['product_id' => $productId], [
            'product_id' => 'required|exists:products,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Sản phẩm không tồn tại',
                'errors' => $validator->errors()
            ], 404);
        }

        $hasReviewed = Review::userHasReviewed($userId, $productId);
        $hasPurchased = Review::userHasPurchased($userId, $productId);

        return response()->json([
            'success' => true,
            'data' => [
                'can_review' => !$hasReviewed,
                'has_reviewed' => $hasReviewed,
                'has_purchased' => $hasPurchased,
                'can_verified_purchase' => $hasPurchased,
            ]
        ]);
    }
}
