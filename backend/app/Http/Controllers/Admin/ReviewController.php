<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    /**
     * Lấy danh sách tất cả review (có filter và search)
     */
    public function index(Request $request)
    {
        $query = Review::with(['user', 'product'])
            ->withCount('replies');

        // Filter theo trạng thái
        if ($request->has('status')) {
            $status = $request->get('status');
            if (in_array($status, ['pending', 'approved', 'rejected'])) {
                $query->where('status', $status);
            }
        }

        // Filter theo rating
        if ($request->has('rating') && $request->rating >= 1 && $request->rating <= 5) {
            $query->where('rating', $request->rating);
        }

        // Filter theo sản phẩm
        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        // Search theo tên user hoặc email
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('firstname', 'like', "%{$search}%")
                    ->orWhere('lastname', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })->orWhereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        // Sắp xếp
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 20);
        $reviews = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $reviews->items(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
                'last_page' => $reviews->lastPage(),
            ]
        ]);
    }

    /**
     * Lấy chi tiết review
     */
    public function show($id)
    {
        $review = Review::with(['user', 'product', 'replies.user'])->find($id);

        if (!$review) {
            return response()->json([
                'success' => false,
                'message' => 'Review không tồn tại'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $review
        ]);
    }

    /**
     * Duyệt/không duyệt review
     */
    public function updateStatus(Request $request, $id)
    {
        $review = Review::find($id);

        if (!$review) {
            return response()->json([
                'success' => false,
                'message' => 'Review không tồn tại'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'nullable|string|max:500' // Lý do từ chối
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        $review->update([
            'status' => $request->status,
            'rejection_reason' => $request->rejection_reason
        ]);

        // Có thể thêm thông báo cho user ở đây

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái thành công',
            'data' => $review
        ]);
    }

    /**
     * Xóa review
     */
    public function destroy($id)
    {
        $review = Review::with('replies')->find($id);

        if (!$review) {
            return response()->json([
                'success' => false,
                'message' => 'Review không tồn tại'
            ], 404);
        }

        // Xóa tất cả replies trước
        $review->replies()->delete();
        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa review thành công'
        ]);
    }

    /**
     * Thống kê review
     */
    public function statistics()
    {
        $totalReviews = Review::count();
        $pendingReviews = Review::where('status', 'pending')->count();
        $approvedReviews = Review::where('status', 'approved')->count();
        $rejectedReviews = Review::where('status', 'rejected')->count();

        // Phân bố rating
        $ratingDistribution = Review::selectRaw('rating, COUNT(*) as count')
            ->where('status', 'approved')
            ->groupBy('rating')
            ->orderBy('rating', 'DESC')
            ->get();

        // Top sản phẩm có nhiều review nhất
        $topProducts = Review::selectRaw('product_id, COUNT(*) as review_count, AVG(rating) as avg_rating')
            ->where('status', 'approved')
            ->groupBy('product_id')
            ->orderBy('review_count', 'DESC')
            ->with('product')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_reviews' => $totalReviews,
                'pending_reviews' => $pendingReviews,
                'approved_reviews' => $approvedReviews,
                'rejected_reviews' => $rejectedReviews,
                'rating_distribution' => $ratingDistribution,
                'top_products' => $topProducts,
            ]
        ]);
    }

    /**
     * Lấy danh sách review chờ duyệt
     */
    public function getPendingReviews()
    {
        $reviews = Review::with(['user', 'product'])
            ->where('status', 'pending')
            ->orderBy('created_at', 'DESC')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $reviews->items(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
                'last_page' => $reviews->lastPage(),
            ]
        ]);
    }
}