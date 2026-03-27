// shopping-view/payment/PaymentSuccessPage.tsx
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Lấy params từ URL mà backend redirect về (xem lại redirectToFrontend trong PaymentController)
  const localOrderId = searchParams.get('local_order_id');
  const paypalOrderId = searchParams.get('paypal_order_id');
  const amount = searchParams.get('amount');
  const error = searchParams.get('error');

  useEffect(() => {
    // Nếu có lỗi từ backend (ví dụ capture thất bại)
    if (error) {
      setLoading(false);
      return;
    }

    // Nếu không có order ID → redirect về home
    if (!localOrderId) {
      navigate('/');
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Gọi API lấy chi tiết đơn hàng (bạn cần có route này, ví dụ: GET /api/shopping/order/{id})
        const response = await axios.get(`${API_URL}/shopping/order/${localOrderId}`, { headers });

        if (response.data.success) {
          setOrderDetails(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [localOrderId, error, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  // Nếu có lỗi từ backend
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Thanh toán gặp lỗi
          </h1>
          <p className="text-gray-600 mb-6">
            {decodeURIComponent(error)}
          </p>
          <Button asChild className="w-full">
            <Link to="/cart">Quay lại giỏ hàng</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Thanh toán thành công!
            </h1>
            <p className="text-gray-600 text-lg mb-6">
              Cảm ơn bạn đã mua sắm. Đơn hàng của bạn đã được xác nhận và đang được xử lý.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Badge className="bg-blue-100 text-blue-800 px-6 py-3 text-lg">
                Mã đơn hàng: #{localOrderId}
              </Badge>
              {paypalOrderId && (
                <Badge variant="secondary" className="px-6 py-3 text-lg">
                  PayPal ID: {paypalOrderId}
                </Badge>
              )}
            </div>
            {amount && (
              <p className="text-2xl font-bold text-blue-600 mt-6">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(parseFloat(amount))}
              </p>
            )}
          </div>

          {/* Order Summary Card */}
          {orderDetails && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Thông tin đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Phương thức thanh toán</p>
                    <p className="font-medium capitalize">{orderDetails.payment_method || 'paypal'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Trạng thái đơn hàng</p>
                    <Badge className="bg-green-100 text-green-800">
                      {orderDetails.status === 'paid' ? 'Đã thanh toán' : orderDetails.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-gray-600">Ngày đặt hàng</p>
                    <p className="font-medium">
                      {new Date(orderDetails.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tổng tiền</p>
                    <p className="font-bold text-lg">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(orderDetails.total_price || orderDetails.discount_total_price || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator className="my-8" />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Button variant="outline" size="lg" asChild className="flex-1">
              <Link to="/">
                <Home className="w-5 h-5 mr-2" />
                Tiếp tục mua sắm
              </Link>
            </Button>
          </div>

          {/* Additional Info Cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Đã xác nhận</h3>
                <p className="text-sm text-gray-600">Đơn hàng đã được ghi nhận thành công</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Thời gian giao hàng</h3>
                <p className="text-sm text-gray-600">Dự kiến 2-5 ngày làm việc</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Email xác nhận</h3>
                <p className="text-sm text-gray-600">Đã gửi thông tin đơn hàng đến email của bạn</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;