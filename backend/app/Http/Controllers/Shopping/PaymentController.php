<?php

namespace App\Http\Controllers\Shopping;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Log;
use App\Models\Order;
use App\Models\Payment;
use App\Services\PayPalService;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    protected $paypalService;

    public function __construct(PayPalService $paypalService)
    {
        $this->paypalService = $paypalService;
    }

    /**
     * Tạo PayPal Order – Frontend gọi
     */
    public function createPayPalPayment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'order_id' => 'required|exists:orders,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $order = Order::findOrFail($request->order_id);

            if ($order->status === 'processing') {
                return response()->json([
                    'success' => false,
                    'message' => 'Order already paid'
                ], 400);
            }

            $amount = $order->discount_total_price ?? $order->total_price;

            // Chuyển VND → USD
            $exchangeRate = config('paypal.exchange_rate', 25000);
            $usdAmount = round($amount / $exchangeRate, 2);

            // Tạo payment record
            $payment = Payment::create([
                'order_id' => $order->id,
                'payment_method' => 'paypal',
                'amount' => $usdAmount,
                'currency' => 'USD',
                'status' => 'pending',
                'payment_info' => ['created_at' => now()->toISOString()]
            ]);

            $description = "Payment for Order #{$order->id}";

            $paypalResult = $this->paypalService->createOrder(
                $order->id,
                $usdAmount,
                'USD',
                $description
            );

            if (!$paypalResult['success']) {
                $payment->update(['status' => 'cancelled']);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create PayPal order',
                    'error' => $paypalResult['error'] ?? 'Unknown error'
                ], 500);
            }

            // Lưu PayPal Order ID
            $payment->update([
                'payment_id' => $paypalResult['order_id'],
                'payment_info' => array_merge($payment->payment_info ?? [], [
                    'approval_url' => $paypalResult['approval_url'],
                    'paypal_status' => $paypalResult['status']
                ])
            ]);

            return response()->json([
                'success' => true,
                'message' => 'PayPal order created successfully',
                'data' => [
                    'paypal_order_id' => $paypalResult['order_id'],
                    'approval_url' => $paypalResult['approval_url'],
                    'local_order_id' => $order->id,
                    'amount' => $usdAmount,
                    'currency' => 'USD',
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Create PayPal Payment Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PayPal redirect về sau khi approve → capture tự động
     */
    public function paypalSuccess(Request $request)
    {
        $paypalOrderId = $request->query('token');

        if (!$paypalOrderId) {
            return $this->redirectToFrontend('failed', 'Missing PayPal order token');
        }

        return $this->capturePayPalOrder($paypalOrderId);
    }

    /**
     * Capture thanh toán
     */
    private function capturePayPalOrder($paypalOrderId)
    {
        DB::beginTransaction();

        try {
            $payment = Payment::where('payment_id', $paypalOrderId)
                ->where('status', 'pending')
                ->firstOrFail();

            $order = $payment->order;

            $captureResult = $this->paypalService->captureOrder($paypalOrderId);

            if (!$captureResult['success']) {
                $payment->update(['status' => 'cancelled']);
                DB::commit();
                return $this->redirectToFrontend('failed', $captureResult['error'] ?? 'Capture failed');
            }

            // Cập nhật payment
            $payment->update([
                'status' => 'completed',
                'transaction_id' => $captureResult['capture_id'],
                'payer_id' => $captureResult['payer']['payer_id'] ?? null,
                'payer_email' => $captureResult['payer']['email'] ?? null,
                'payment_info' => array_merge($payment->payment_info ?? [], [
                    'captured_at' => now()->toISOString(),
                    'capture_response' => $captureResult
                ])
            ]);

            // Cập nhật order
            $order->update(['status' => 'processing']);

            // Xóa cart
            $this->clearUserCart();

            DB::commit();

            return $this->redirectToFrontend('success', '', [
                'local_order_id' => $order->id,
                'paypal_order_id' => $paypalOrderId,
                'amount' => $payment->amount
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('PayPal Capture Error: ' . $e->getMessage());
            return $this->redirectToFrontend('failed', $e->getMessage());
        }
    }

    /**
     * PayPal redirect về khi khách cancel
     */
    public function paypalCancel(Request $request)
    {
        $paypalOrderId = $request->query('token');

        if ($paypalOrderId) {
            $payment = Payment::where('payment_id', $paypalOrderId)
                ->where('status', 'pending')
                ->first();

            if ($payment) {
                $payment->update(['status' => 'cancelled']);
            }
        }

        return $this->redirectToFrontend('cancel');
    }

    /**
     * Helper: Redirect về frontend
     */
    private function redirectToFrontend(string $page, string $error = '', array $extraParams = [])
    {
        $frontendUrl = 'http://localhost:5173';
        $base = "{$frontendUrl}/payment/{$page}";

        $params = [];
        if ($error) {
            $params['error'] = urlencode($error);
        }
        $params = array_merge($params, $extraParams);

        $query = $params ? '?' . http_build_query($params) : '';

        return redirect($base . $query);
    }

    /**
     * Xóa cart sau thanh toán thành công
     */
    private function clearUserCart()
    {
        try {
            $user = Auth::user();
            $sessionId = request()->session()->getId();

            $cart = Cart::where(function ($query) use ($user, $sessionId) {
                if ($user) {
                    $query->where('user_id', $user->id);
                } else {
                    $query->where('session_id', $sessionId);
                }
            })->where('status', 'pending')->first();

            if ($cart) {
                $cart->cartDetails()->delete();
                $cart->update(['total_quantity' => 0, 'total_price' => 0, 'status' => 'ordered']);
            }
        } catch (\Exception $e) {
            Log::error('Clear Cart Error: ' . $e->getMessage());
        }
    }
}
