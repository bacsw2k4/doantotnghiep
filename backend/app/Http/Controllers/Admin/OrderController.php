<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Log;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{

    public function index(Request $request)
    {
        $query = Order::with(['user', 'voucher', 'shippingAddress', 'statusHistories'])
            ->orderBy('createdate', 'desc');
        if ($request->search) {
            $query->whereHas('user', fn($q) => $q->where('name', 'like', "%{$request->search}%"))
                ->orWhere('id', 'like', "%{$request->search}%");
        }
        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        $perPage = $request->per_page ?? 20;

        return response()->json([
            'data' => $query->paginate($perPage)
        ]);
    }


    /**
     * Display the specified resource.
     */
    public function show(Order $order)
    {
        $order->load(['user', 'voucher', 'shippingAddress', 'orderDetails.product', 'orderDetails.attributes', 'statusHistories.user']);
        return response()->json(['data' => $order]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function updateStatus(Request $request, Order $order)
    {
        //so sánh trạng thái cũ và mới để quyết định xem ghi chú có bắt buộc hay không
        $isSameStatus = $order->status === $request->status;

        $request->validate([
            'status' => 'required|in:pending,confirmed,processing,shipped,delivered,cancelled',
            'note' => $isSameStatus ? 'required|string|min:5|max:500' : 'nullable|string|max:500' //neu trạng thái  thay đổi thì ghi chú bắt buộc, ngược lại thì ghi chú có thể để trống
        ], [
            'note.required' => 'Ghi chú là bắt buộc khi không thay đổi trạng thái',
            'note.min' => 'Ghi chú phải có ít nhất 5 ký tự'
        ]);

        $order->update(['status' => $request->status]);

        $order->statusHistories()->create([
            'status' => $request->status,
            'note' => $request->note,
            'user_id' => auth()->id(),
        ]);

        return response()->json([
            'message' => "Cập nhật trạng thái thành công!",
            'status' => $request->status,
            'history_count' => $order->statusHistories()->count()
        ]);
    }
    public function destroy(Order $order)
    {
        //check trạng thái đơn hàng trước khi xóa
        if (in_array($order->status, ['shipped', 'delivered'])) {
            return response()->json([
                'message' => 'Không thể xóa đơn hàng đang giao hoặc đã giao thành công!',
                'status'  => 'error'
            ], 422);
        }

        DB::beginTransaction();
        try {
            $order->orderDetails()->each(function ($detail) {
                $detail->attributes()->delete();
                $detail->delete();
            });

            $order->statusHistories()->delete();
            $order->payments()->delete();
            $order->delete();

            Log::add(
                request(),
                "Xóa đơn hàng #{$order->id}",
                'delete',
                "Đơn hàng #{$order->id} - Trạng thái: {$order->status} - Tổng tiền: " . number_format($order->total_price) . "đ"
            );

            DB::commit();

            return response()->json([
                'message'  => 'Xóa đơn hàng thành công!',
                'order_id' => $order->id
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::add(
                request(),
                "Lỗi khi xóa đơn hàng #{$order->id}",
                'error',
                $e->getMessage()
            );

            return response()->json([
                'message' => 'Xóa đơn hàng thất bại!',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:orders,id'
        ]);

        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return response()->json(['message' => 'Không có đơn hàng nào được chọn'], 400);
        }

        $orders = Order::whereIn('id', $ids)->get();

        $invalidOrders = $orders->filter(fn($order) => in_array($order->status, ['shipped', 'delivered']));

        if ($invalidOrders->isNotEmpty()) {
            return response()->json([
                'message'     => 'Một số đơn hàng không thể xóa (đang giao hoặc đã giao thành công)',
                'invalid_ids' => $invalidOrders->pluck('id')->toArray()
            ], 422);
        }

        DB::beginTransaction();
        try {
            foreach ($orders as $order) {
                $order->orderDetails()->each(function ($detail) {
                    $detail->attributes()->delete();
                    $detail->delete();
                });

                $order->statusHistories()->delete();
                $order->payments()->delete();
                $order->delete();

                Log::add(
                    $request,
                    "Xóa đơn hàng #{$order->id} (bulk delete)",
                    'delete',
                    "Đơn hàng #{$order->id} - Trạng thái: {$order->status}"
                );
            }

            DB::commit();

            return response()->json([
                'message'       => "Đã xóa " . count($ids) . " đơn hàng thành công!",
                'deleted_count' => count($ids)
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::add(
                $request,
                "Lỗi khi xóa nhiều đơn hàng",
                'error',
                "IDs: " . implode(', ', $ids) . " | " . $e->getMessage()
            );

            return response()->json([
                'message' => 'Xóa hàng loạt thất bại!',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}