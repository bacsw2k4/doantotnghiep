// shopping-view/payment/PaymentCancelPage.tsx
import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, ShoppingCart, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const PaymentCancelPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Cancel Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Thanh toán đã bị hủy
            </h1>
            <p className="text-gray-600 text-lg mb-6">
              Bạn đã hủy quá trình thanh toán. Đơn hàng của bạn vẫn được lưu.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Thanh toán chưa hoàn tất
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Bạn có thể:
                      </p>
                      <ul className="mt-1 list-disc list-inside">
                        <li>Thử thanh toán lại với phương thức khác</li>
                        <li>Chọn thanh toán khi nhận hàng (COD)</li>
                        <li>Liên hệ hỗ trợ nếu gặp vấn đề</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {paymentId && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Mã thanh toán</p>
                  <p className="font-mono text-sm">{paymentId}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button variant="outline" asChild className="w-full">
                  <Link to="/cart">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại giỏ hàng
                  </Link>
                </Button>
                
                {orderId && (
                  <Button asChild className="w-full">
                    <Link to={`/checkout?order=${orderId}`}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Thử thanh toán lại
                    </Link>
                  </Button>
                )}
              </div>

              <Separator />

              <div className="text-center">
                <h3 className="font-semibold mb-2">Cần hỗ trợ?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Liên hệ với chúng tôi nếu bạn gặp vấn đề với thanh toán
                </p>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Hotline:</span> 1900 1234
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> support@example.com
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alternative Payment Methods */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Phương thức thanh toán khác</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Thanh toán khi nhận hàng (COD)</h4>
                      <p className="text-sm text-gray-600">
                        Thanh toán bằng tiền mặt khi nhận hàng
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-1.646-1.205-4.303-1.787-7.946-1.787H6.734a.732.732 0 0 0-.723.849L8.79 19.037a.732.732 0 0 0 .722.62h3.882a.75.75 0 0 0 .743-.64l.842-5.338c.072-.46.432-.8.896-.8h.57c4.012 0 7.092-1.977 7.93-6.017.11-.527.185-1.102.185-1.68 0-.21-.015-.419-.045-.625z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">PayPal</h4>
                      <p className="text-sm text-gray-600">
                        Thanh toán qua tài khoản PayPal
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelPage;