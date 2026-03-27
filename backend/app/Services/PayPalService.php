<?php

namespace App\Services;

use App\Models\Log as ModelsLog;
use Srmklive\PayPal\Services\PayPal as PayPalClient;
use Illuminate\Support\Facades\Log;
use Exception;

class PayPalService
{
    protected $provider;
    public function __construct()
    {
        $this->provider = new PayPalClient();
        $this->provider->setApiCredentials(config('paypal'));
        $this->provider->getAccessToken(); // Lấy token tự động

        Log::info('PayPal Service initialized successfully');
    }
    /**
     * Tạo PayPal Order
     * //TẠO ORDER NHƯNG CHƯA XÁC NHẬN THANH TOÁN
     */
    public function createOrder($orderId, $amount, $currency = 'USD', $description = '')
    {
        try {
            $baseUrl = 'http://127.0.0.1:8000';
            $data = [
                'intent' => 'CAPTURE',
                'purchase_units' => [
                    [
                        'reference_id' => (string)$orderId,
                        'description' => $description ?: "Payment for Oder #{$orderId}",
                        'amount' => [
                            'currency_code' => strtoupper($currency),
                            'value' => number_format($amount, 2, '.', '')
                        ]
                    ]
                ],
                'application_context' => [
                    'brand_name' => config('app.name', 'Your Store'),
                    'shipping_preference' => 'NO_SHIPPING',
                    'user_action' => 'PAY_NOW',
                    'return_url' => $baseUrl . 'api/payment/paypal/success',
                    'cancel_url' => $baseUrl . 'api/payment/paypal/cancel',
                ]
            ];
            $response = $this->provider->createOrder($data);
            Log::info('paypal raw create order response', ['response' => $response]);
            // Kiểm tra lỗi chi tiết từ PayPal
            if (isset($response['error'])) {
                $errorMsg = $response['error']['message'] ?? 'Unknown PayPal error';
                if (isset($response['error']['details'][0])) {
                    $detail = $response['error']['details'][0];
                    $errorMsg .= " - {$detail['issue']}: {$detail['description']}";
                }
                Log::error('PayPal Create Order Error', ['response' => $response]);
                return [
                    'success' => false,
                    'error' => $errorMsg
                ];
            }

            // Tìm approval URL
            $approvalUrl = collect($response['links'])->firstWhere('rel', 'approve')['href'] ?? null;

            if (!$approvalUrl) {
                return [
                    'success' => false,
                    'error' => 'No approval URL returned from PayPal'
                ];
            }

            return [
                'success' => true,
                'order_id' => $response['id'],
                'approval_url' => $approvalUrl,
                'status' => $response['status'],
                'links' => $response['links']
            ];
        } catch (Exception $e) {
            Log::error('PayPal Create Order Exception: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    /**
     * Capture Order sau khi người dùng approve
     * //XÁC NHẬN THANH TOÁN
     */
    public function captureOrder($paypalOrderId)
    {
        try {
            $response = $this->provider->capturePaymentOrder($paypalOrderId);

            if ($response['status'] === 'COMPLETED') {
                $capture = $response['purchase_units'][0]['payments']['captures'][0] ?? null;

                $payer = $response['payer'] ?? null;

                return [
                    'success' => true,
                    'order_id' => $response['id'],
                    'status' => $response['status'],
                    'capture_id' => $capture['id'] ?? null,
                    'amount' => $capture['amount']['value'] ?? null,
                    'payer' => [
                        'payer_id' => $payer['payer_id'] ?? null,
                        'email' => $payer['email_address'] ?? null,
                        'name' => $payer['name']['given_name'] . ' ' . $payer['name']['surname'] ?? null
                    ]
                ];
            }

            return ['success' => false, 'error' => 'Capture not completed'];
        } catch (Exception $e) {
            Log::error('PayPal Capture Error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    /**
     * Refund
     */
    public function refundPayment($captureId, $amount = null, $currency = 'USD')
    {
        try {
            $data = $amount ? ['amount' => ['value' => number_format($amount, 2, '.', ''), 'currency_code' => $currency]] : [];

            $response = $this->provider->refundCapturedPayment($captureId, $data);

            return [
                'success' => true,
                'refund_id' => $response['id'],
                'status' => $response['status'],
                'amount' => $response['amount']['value'] ?? null
            ];
        } catch (Exception $e) {
            Log::error('PayPal Refund Error: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}