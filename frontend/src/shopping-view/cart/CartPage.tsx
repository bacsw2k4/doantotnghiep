import React, { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { applyVoucher, clearVoucher } from "@/store/voucher/voucher-slice";
import type { RootState } from "@/store/store";

interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  variant?: string | null;
  inStock: boolean;
  product_id: number;
}

interface CartResponse {
  data: CartItem[];
  total_items: number;
  total_price: number;
}

const CartPage: React.FC<{ selectedLangId: number }> = ({ selectedLangId }) => {
  const dispatch = useDispatch();
  const voucher = useSelector((state: RootState) => state.voucher);
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchCart = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<CartResponse>(
        "http://localhost:8000/api/shopping/cart",
        {
          params: { lang_id: selectedLangId },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      const items = response.data.data.map((item) => ({
        ...item,
        inStock: true,
      }));
      setCartItems(items);
    } catch (error: any) {
      toast.error(
        "Không thể tải giỏ hàng: " +
          (error.response?.data?.message || error.message)
      );
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [selectedLangId]);

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }
    setIsLoading(true);
    try {
      await axios.put(
        `http://localhost:8000/api/shopping/cart/${id}`,
        {
          quantity: newQuantity,
          lang_id: selectedLangId
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      setCartItems((items) =>
        items.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
      toast.success("Đã cập nhật số lượng.");
    } catch (error: any) {
      toast.error(
        "Không thể cập nhật số lượng: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (id: string) => {
    setIsLoading(true);
    try {
      await axios.delete(`http://localhost:8000/api/shopping/cart/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        params: { lang_id: selectedLangId }
      });
      setCartItems((items) => items.filter((item) => item.id !== id));
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng.");
    } catch (error: any) {
      toast.error(
        "Không thể xóa sản phẩm: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Vui lòng nhập mã giảm giá.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:8000/api/shopping/apply-coupon",
        { voucher_code: couponCode, lang_id: selectedLangId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      
      // Lưu voucher vào Redux
      dispatch(applyVoucher({
        code: couponCode,
        discount: response.data.discount || 0,
        discountPercent: response.data.discountPercent || 0,
        type: response.data.type || 'fixed',
        minMoney: response.data.minmoney || 0
      }));
      
      setCouponCode("");
      toast.success("Áp dụng mã giảm giá thành công!");
    } catch (error: any) {
      toast.error(
        "Không thể áp dụng mã giảm giá: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const removeVoucher = () => {
    dispatch(clearVoucher());
    toast.success("Đã xóa mã giảm giá");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(price);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = subtotal > 5000000 ? 0 : 30000;
  const total = subtotal - voucher.discount + shipping;

  const totalSavings = cartItems.reduce(
    (sum, item) =>
      sum +
      (item.originalPrice
        ? (item.originalPrice - item.price) * item.quantity
        : 0),
    0
  );

  if (isLoading && cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 flex justify-center items-center">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Đang tải giỏ hàng...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Giỏ hàng trống</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các sản phẩm
              tuyệt vời của chúng tôi!
            </p>
            <Link to="/">
              <Button size="lg" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Tiếp tục mua sắm
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b mt-12 from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Tiếp tục mua sắm
          </Link>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Giỏ hàng của bạn
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Bạn có {cartItems.length} sản phẩm trong giỏ hàng
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => (
              <Card
                key={item.id}
                className="overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex gap-4 md:gap-6">
                    <div className="relative flex-shrink-0">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover bg-gray-100 dark:bg-gray-800"
                      />
                      {item.originalPrice && (
                        <Badge className="absolute -top-2 -right-2 bg-red-500">
                          -
                          {Math.round(
                            ((item.originalPrice - item.price) /
                              item.originalPrice) *
                              100
                          )}
                          %
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                            {item.name}
                          </h3>
                          {item.variant && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.variant}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant={item.inStock ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {item.inStock ? "Còn hàng" : "Hết hàng"}
                            </Badge>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="h-9 w-9 p-0 rounded-full"
                            disabled={isLoading}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-12 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="h-9 w-9 p-0 rounded-full"
                            disabled={isLoading}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            {item.originalPrice && (
                              <span className="text-sm text-gray-400 line-through">
                                {formatPrice(
                                  item.originalPrice * item.quantity
                                )}
                              </span>
                            )}
                            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                          {item.quantity > 1 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {formatPrice(item.price)} x {item.quantity}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-bold">Tóm tắt đơn hàng</h2>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Tạm tính
                      </span>
                      <span className="font-medium">
                        {formatPrice(subtotal)}
                      </span>
                    </div>

                    {totalSavings > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Tiết kiệm
                        </span>
                        <span className="font-medium text-green-600">
                          -{formatPrice(totalSavings)}
                        </span>
                      </div>
                    )}

                    {voucher.code && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Mã giảm giá ({voucher.code})
                        </span>
                        <span className="font-medium text-green-600">
                          -{formatPrice(voucher.discount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Phí vận chuyển
                      </span>
                      <span className="font-medium">
                        {shipping === 0 ? "Miễn phí" : formatPrice(shipping)}
                      </span>
                    </div>

                    {shipping > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Mua thêm {formatPrice(5000000 - subtotal)} để được
                          miễn phí vận chuyển
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {formatPrice(total)}
                    </span>
                  </div>

                  <Link to="/checkout" className="block">
                    <Button
                      className="w-full h-12 text-base font-medium"
                      disabled={isLoading}
                    >
                      Tiến hành thanh toán
                    </Button>
                  </Link>

                  <Link to="/" className="block">
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      disabled={isLoading}
                    >
                      Tiếp tục mua sắm
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="font-semibold">Mã giảm giá</h3>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Nhập mã giảm giá"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1"
                      disabled={isLoading || !!voucher.code}
                    />
                    <Button
                      onClick={applyCoupon}
                      variant="outline"
                      disabled={isLoading || !!voucher.code}
                    >
                      Áp dụng
                    </Button>
                  </div>

                  {voucher.code && (
                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                          Mã đã được áp dụng: {voucher.code}
                        </span>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          Giảm {voucher.type === 'percentage' ? `${voucher.discountPercent}%` : formatPrice(voucher.discount)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeVoucher}
                        className="h-6 text-xs"
                      >
                        Xóa
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trust Badges */}
              <Card>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      Miễn phí đổi trả trong 30 ngày
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      Thanh toán an toàn & bảo mật
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-purple-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      Giao hàng nhanh chóng
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;