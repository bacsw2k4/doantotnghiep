<?php

namespace App\Http\Controllers\Shopping;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Log;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\OrderDetailAttribute;
use App\Models\ShippingAddress;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function show($order_id, Request $request)
    {
        $lang_id = $request->query('lang_id', 1);
        $order = Order::with(['orderDetails.product', 'orderDetails.attributes.attribute'])
            ->where('language_id', $lang_id)
            ->findOrFail($order_id);

        return response()->json([
            'order_id' => $order->id,
            'items' => $order->orderDetails->map(function ($item) {
                $variant = $item->attributes->map(function ($attr) {
                    return $attr->attribute ? $attr->attribute->name : null;
                })->filter()->implode(', ');

                return [
                    'id' => $item->id,
                    'name' => $item->product ? $item->product->name : 'Unknown Product',
                    'price' => $item->price,
                    'quantity' => $item->volume,
                    'image' => $item->product ? $item->product->image : null,
                    'variant' => $variant ?: null,
                    'product_id' => $item->product_id,
                ];
            }),
            'total_price' => $order->discount_total_price ?? $order->total_price,
            'shipping_address' => [
                'full_name' => $order->shippingAddress ? $order->shippingAddress->name : null,
                'phone' => $order->shippingAddress ? $order->shippingAddress->phone : null,
                'email' => $order->shippingAddress ? $order->shippingAddress->email : null,
                'address' => $order->shippingAddress ? $order->shippingAddress->address : null,
                'city' => $order->shippingAddress ? $order->shippingAddress->city : null,
                'district' => $order->shippingAddress ? strstr($order->shippingAddress->desc, ',', true) : null,
                'ward' => $order->shippingAddress ? trim(strstr($order->shippingAddress->desc, ',')) : null,
            ],
            'note' => $order->shippingAddress ? $order->shippingAddress->desc : null,
            'status' => $order->status,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:100',
            'district' => 'required|string|max:100',
            'ward' => 'string|max:100',
            'note' => 'nullable|string',
            'voucher_code' => 'nullable|string|exists:vouchers,code',
            'lang_id' => 'required|exists:languages,id',
        ]);

        try {
            $user = Auth::user();
            $sessionId = $request->session()->getId();

            $cart = Cart::where(function ($query) use ($user, $sessionId) {
                if ($user) {
                    $query->where('user_id', $user->id);
                } else {
                    $query->where('session_id', $sessionId);
                }
            })
                ->where('status', 'pending')
                ->first();

            if (!$cart || !$cart->cartDetails()->exists()) {
                return response()->json([
                    'message' => 'Giỏ hàng trống, không thể đặt hàng.',
                ], 400);
            }

            DB::beginTransaction();

            $shippingAddress = ShippingAddress::create([
                'user_id' => $user ? $user->id : null,
                'name' => $request->full_name,
                'phone' => $request->phone,
                'email' => $request->email,
                'address' => $request->address,
                'city' => $request->city,
                'desc' => $request->district . ', ' . $request->ward . ($request->note ? ', ' . $request->note : ''),
                'country' => $request->country ?? 'Vietnam',
                'createdate' => now(),
                'updatedate' => now(),
            ]);

            $cartDetails = $cart->cartDetails()->with(['attributes'])->get();
            $subtotal = $cart->total_price;
            $shippingFee = $request->shipping_method === 'express' ? 50000 : 0;
            $discountPrice = 0;
            $discountPercent = 0;

            if ($request->voucher_code) {
                $voucher = Voucher::where('code', $request->voucher_code)
                    ->where('status', 'active')
                    ->where('enddate', '>=', now())
                    ->where('createdate', '<=', now())
                    ->first();

                if ($voucher && $subtotal >= ($voucher->minmoney ?? 0)) {
                    if ($voucher->type === 'percentage') {
                        $discountPercent = $voucher->discount;
                        $discountPrice = $subtotal * ($voucher->discount / 100);
                    } else {
                        $discountPrice = $voucher->discount;
                    }
                }
            }

            $totalPrice = $subtotal + $shippingFee - $discountPrice;

            $order = Order::create([
                'author' => $user ? $user->id : null,
                'shippingaddress_id' => $shippingAddress->id,
                'discount_price' => $discountPrice,
                'voucher_code' => $request->voucher_code,
                'discount_percent' => $discountPercent,
                'total_price' => $subtotal + $shippingFee,
                'discount_total_price' => $totalPrice,
                'createdate' => now(),
                'updatedate' => now(),
                'status' => 'pending',
                'language_id' => $request->lang_id,
            ]);

            foreach ($cartDetails as $detail) {
                $orderDetail = OrderDetail::create([
                    'orders_id' => $order->id,
                    'product_id' => $detail->product_id,
                    'price' => $detail->price,
                    'volume' => $detail->quantity,
                    'total_price' => $detail->total_price,
                    'createdate' => now(),
                ]);

                foreach ($detail->attributes as $attribute) {
                    OrderDetailAttribute::create([
                        'order_details_id' => $orderDetail->id,
                        'attribute_id' => $attribute->id,
                    ]);
                }
            }

            $cart->cartDetails()->delete();
            $cart->update([
                'total_quantity' => 0,
                'total_price' => 0,
                'status' => 'ordered',
                'enddate' => now(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Đặt hàng thành công.',
                'order_id' => $order->id,
                'total_price' => $totalPrice,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Không thể tạo đơn hàng: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function applyCoupon(Request $request)
    {
        $request->validate([
            'voucher_code' => 'required|string|exists:vouchers,code',
            'lang_id' => 'required|exists:languages,id',
        ]);

        try {
            $user = Auth::user();
            $sessionId = $request->session()->getId();

            $cart = Cart::where(function ($query) use ($user, $sessionId) {
                if ($user) {
                    $query->where('user_id', $user->id);
                } else {
                    $query->where('session_id', $sessionId);
                }
            })
                ->where('status', 'pending')
                ->first();

            if (!$cart || !$cart->cartDetails()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Giỏ hàng trống, không thể áp dụng mã giảm giá.',
                ], 400);
            }

            $voucher = Voucher::where('code', $request->voucher_code)
                ->where('status', 'active')
                ->where('enddate', '>=', now())
                ->where('createdate', '<=', now())
                ->first();

            if (!$voucher) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mã giảm giá không hợp lệ hoặc đã hết hạn.',
                ], 400);
            }

            $subtotal = $cart->total_price;

            if ($voucher->minmoney && $subtotal < $voucher->minmoney) {
                return response()->json([
                    'success' => false,
                    'message' => sprintf(
                        'Tổng giá trị giỏ hàng phải từ %s để áp dụng mã giảm giá.',
                        number_format($voucher->minmoney, 0, ',', '.') . 'đ'
                    ),
                    'minmoney' => $voucher->minmoney,
                ], 400);
            }

            $discount = 0;
            $discountPercent = 0;

            if ($voucher->type === 'percentage') {
                $discountPercent = $voucher->discount;
                $discount = $subtotal * ($voucher->discount / 100);
                if (isset($voucher->max_discount) && $discount > $voucher->max_discount) {
                    $discount = $voucher->max_discount;
                }
            } else {
                $discount = $voucher->discount;
            }

            if ($discount > $subtotal) {
                $discount = $subtotal;
            }

            return response()->json([
                'success' => true,
                'message' => 'Áp dụng mã giảm giá thành công.',
                'discount' => round($discount, 2),
                'discountPercent' => $discountPercent,
                'type' => $voucher->type,
                'minmoney' => $voucher->minmoney ?? 0,
                'voucher_code' => $voucher->code,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error applying coupon: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Không thể áp dụng mã giảm giá: ' . $e->getMessage(),
            ], 500);
        }
    }
}
