<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\ReviewReply;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReviewReplyController extends Controller
{
    /**
     * Thêm phản hồi cho review
     */
    public function store(Request $request, $reviewId)
    {
        $review = Review::find($reviewId);

        if (!$review) {
            return response()->json([
                'success' => false,
                'message' => 'Review không tồn tại'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'reply_content' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        $reply = ReviewReply::create([
            'review_id' => $reviewId,
            'user_id' => auth()->id(),
            'reply_content' => $request->reply_content,
        ]);

        // Cập nhật trạng thái has_reply
        $review->update(['has_reply' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Phản hồi đã được gửi thành công',
            'data' => $reply->load('user')
        ], 201);
    }

    /**
     * Cập nhật phản hồi
     */
    public function update(Request $request, $id)
    {
        $reply = ReviewReply::find($id);

        if (!$reply) {
            return response()->json([
                'success' => false,
                'message' => 'Phản hồi không tồn tại'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'reply_content' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 422);
        }

        $reply->update(['reply_content' => $request->reply_content]);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật phản hồi thành công',
            'data' => $reply->load('user')
        ]);
    }

    /**
     * Xóa phản hồi
     */
    public function destroy($id)
    {
        $reply = ReviewReply::find($id);

        if (!$reply) {
            return response()->json([
                'success' => false,
                'message' => 'Phản hồi không tồn tại'
            ], 404);
        }

        $review = $reply->review;
        $reply->delete();

        // Kiểm tra nếu không còn reply nào thì update has_reply
        if ($review->replies()->count() == 0) {
            $review->update(['has_reply' => false]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Xóa phản hồi thành công'
        ]);
    }

    /**
     * Lấy danh sách reply của review
     */
    public function getReplies($reviewId)
    {
        $replies = ReviewReply::with('user')
            ->where('review_id', $reviewId)
            ->orderBy('created_at', 'ASC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $replies
        ]);
    }
}