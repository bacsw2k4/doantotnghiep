<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Tổng số đơn hàng
        $totalOrders = Order::count();

        // Tổng doanh thu
        $totalRevenue = Order::sum('total_price');

        // Doanh thu hôm nay
        $todayRevenue = Order::whereDate('createdate', today())->sum('total_price');

        // Tổng số sản phẩm đang active
        $totalProducts = Product::where('status', 'active')->count();

        // Top 5 sản phẩm bán chạy
        $topProducts = OrderDetail::select('product_id', DB::raw('SUM(volume) as total_volume'))
            ->groupBy('product_id')
            ->orderBy('total_volume', 'desc')
            ->take(5)
            ->get()
            ->map(function ($item) {
                $product = Product::find($item->product_id);
                return [
                    'name' => $product?->name ?? 'Sản phẩm không xác định',
                    'total_volume' => $item->total_volume,
                    'price' => $product?->price ?? 0,
                ];
            });

        // Tổng số người dùng
        $totalUsers = User::count();

        // Người dùng mới trong 7 ngày qua
        $newUsers = User::where('created_at', '>=', now()->subDays(7))->count();

        // Đơn hàng mới nhất (top 10)
        $recentOrders = Order::with(['user:id,firstname,lastname', 'orderDetails'])
            ->orderBy('createdate', 'desc')
            ->take(10)
            ->get()
            ->map(function ($order) {
                // Xử lý an toàn trường hợp user bị null (khách vãng lai / guest)
                $customerName = $order->user
                    ? trim(($order->user->firstname ?? '') . ' ' . ($order->user->lastname ?? ''))
                    : 'Khách vãng lai';

                return [
                    'id' => $order->id,
                    'customer' => $customerName ?: 'Khách vãng lai', // Đảm bảo không rỗng
                    'total_price' => $order->total_price,
                    'createdate' => $order->createdate->format('Y-m-d H:i'),
                    'status' => $order->status,
                ];
            });

        // Doanh thu theo tháng (6 tháng gần nhất)
        $monthlyRevenue = Order::select(
            DB::raw('DATE_FORMAT(createdate, "%Y-%m") as month'),
            DB::raw('SUM(total_price) as revenue')
        )
            ->where('createdate', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->get()
            ->pluck('revenue', 'month')
            ->toArray(); // Chuyển sang array để dễ dùng với Chart.js

        return response()->json([
            'success' => true,
            'data' => [
                'totalOrders' => $totalOrders,
                'totalRevenue' => $totalRevenue ?? 0,
                'todayRevenue' => $todayRevenue ?? 0,
                'totalProducts' => $totalProducts,
                'topProducts' => $topProducts,
                'totalUsers' => $totalUsers,
                'newUsers' => $newUsers,
                'recentOrders' => $recentOrders,
                'monthlyRevenue' => $monthlyRevenue,
            ]
        ]);
    }
}
