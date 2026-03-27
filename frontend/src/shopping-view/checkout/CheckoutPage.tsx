// pages/CheckoutPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Building,
  Check,
  Plus,
  Shield,
  Globe,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import axios from "axios";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { clearVoucher } from "@/store/voucher/voucher-slice";
import type { AppDispatch } from "../../store/store";
import { useCart } from "@/hooks/useCart";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string | null;
  product_id: number;
}

interface CartResponse {
  data: CartItem[];
  total_items: number;
  total_price: number;
}

interface ShippingAddress {
  id: number;
  name: string;
  fullName: string;
  phone: string;
  address: string;
  city: string | null;
  country: string | null;
  email: string | null;
  desc: string | null;
  isDefault: boolean;
}

interface ShippingAddressResponse {
  addresses: ShippingAddress[];
  success: boolean;
}

interface CheckoutPageProps {
  selectedLangId: number;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ selectedLangId }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const voucher = useSelector((state: RootState) => state.voucher);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [saveInfo, setSaveInfo] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    district: "",
    ward: "",
    note: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  const { fetchCartItems } = useCart();

  const extractDistrict = (desc: string | null): string => {
    if (!desc) return "";
    const parts = desc.split(", ");
    return parts[0] || "";
  };

  const extractWard = (desc: string | null): string => {
    if (!desc) return "";
    const parts = desc.split(", ");
    return parts[1] || "";
  };

  const fetchCartList = async () => {
    try {
      const response = await axios.get<CartResponse>(
        "http://localhost:8000/api/shopping/cart",
        {
          params: { lang_id: selectedLangId },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setCartItems(response.data.data || []);
    } catch (error: any) {
      setCartItems([]);
    }
  };

  const fetchShippingAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const response = await axios.get<ShippingAddressResponse>(
        "http://localhost:8000/api/auth/shipping-addresses",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const addresses = response.data.addresses || [];
      setShippingAddresses(addresses);

      if (addresses.length > 0) {
        const defaultAddress =
          addresses.find((addr: ShippingAddress) => addr.isDefault) ||
          addresses[0];
        setSelectedAddressId(defaultAddress.id);
        setUseCustomAddress(false);
      } else {
        setUseCustomAddress(true);
      }
    } catch (error: any) {
      setShippingAddresses([]);
      setUseCustomAddress(true);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchCartList();
    fetchShippingAddresses();
  }, [selectedLangId]);

  const hasMounted = useRef(false);
  useEffect(() => {
    if (hasMounted.current) {
      navigate("/");
    } else {
      hasMounted.current = true;
    }
  }, [selectedLangId, navigate]);

  const selectedAddress = shippingAddresses.find(
    (addr) => addr.id === selectedAddressId
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (useCustomAddress) {
      if (!formData.fullName.trim()) newErrors.fullName = "Họ và tên là bắt buộc";
      if (!formData.phone.trim()) newErrors.phone = "Số điện thoại là bắt buộc";
      if (!formData.address.trim()) newErrors.address = "Địa chỉ là bắt buộc";
      if (!formData.city.trim()) newErrors.city = "Tỉnh/Thành phố là bắt buộc";
      if (!formData.district.trim()) newErrors.district = "Quận/Huyện là bắt buộc";
      if (!formData.ward.trim()) newErrors.ward = "Phường/Xã là bắt buộc";
    } else if (!selectedAddressId) {
      newErrors.shippingAddress = "Vui lòng chọn địa chỉ giao hàng";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createOrderAndRedirectToPayPal = async () => {
    try {
      let orderData: any = {
        payment_method: "paypal",
        shipping_method: shippingMethod,
        save_info: saveInfo,
        voucher_code: voucher.code || null,
        lang_id: selectedLangId,
        note: formData.note || null,
      };

      if (useCustomAddress) {
        orderData = {
          ...orderData,
          full_name: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          address: formData.address.trim(),
          city: formData.city.trim(),
          district: formData.district.trim(),
          ward: formData.ward.trim(),
        };
      } else if (selectedAddress) {
        orderData = {
          ...orderData,
          full_name: selectedAddress.fullName,
          phone: selectedAddress.phone,
          email: selectedAddress.email || null,
          address: selectedAddress.address,
          city: selectedAddress.city || "",
          district: extractDistrict(selectedAddress.desc),
          ward: extractWard(selectedAddress.desc),
        };
      }

      const orderResponse = await axios.post(
        "http://localhost:8000/api/shopping/order",
        orderData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (orderResponse.status !== 201) {
        throw new Error(orderResponse.data.message || "Không thể tạo đơn hàng");
      }

      const orderId = orderResponse.data.order_id;

      const paymentResponse = await axios.post(
        "http://localhost:8000/api/payment/paypal/create",
        { order_id: orderId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!paymentResponse.data.success) {
        throw new Error(paymentResponse.data.message || "Không thể khởi tạo thanh toán PayPal");
      }

      const approvalUrl = paymentResponse.data.data.approval_url;
      window.location.href = approvalUrl;
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        for (const field in backendErrors) {
          toast.error(`${field}: ${backendErrors[field][0]}`);
        }
      } else {
        toast.error(
          "Không thể xử lý thanh toán PayPal: " +
            (error.response?.data?.message || error.message || "Lỗi không xác định")
        );
      }
    }
  };

  const handleCheckout = async () => {
    if (!validateForm()) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Giỏ hàng trống, không thể đặt hàng");
      return;
    }

    setIsLoading(true);

    try {
      if (paymentMethod === "cod") {
        let orderData: any = {
          payment_method: "cod",
          shipping_method: shippingMethod,
          save_info: saveInfo,
          voucher_code: voucher.code || null,
          lang_id: selectedLangId,
          note: formData.note || null,
        };

        if (useCustomAddress) {
          orderData = {
            ...orderData,
            full_name: formData.fullName.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim() || null,
            address: formData.address.trim(),
            city: formData.city.trim(),
            district: formData.district.trim(),
            ward: formData.ward.trim(),
          };
        } else if (selectedAddress) {
          orderData = {
            ...orderData,
            full_name: selectedAddress.fullName,
            phone: selectedAddress.phone,
            email: selectedAddress.email || null,
            address: selectedAddress.address,
            city: selectedAddress.city || "",
            district: extractDistrict(selectedAddress.desc),
            ward: extractWard(selectedAddress.desc),
          };
        }

        const response = await axios.post(
          "http://localhost:8000/api/shopping/order",
          orderData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.status === 201) {
          dispatch(clearVoucher());
          await fetchCartItems(selectedLangId, false);
          toast.success("Đặt hàng thành công!");
          navigate(`/order-success?order_id=${response.data.order_id}`);
        }
      } else if (paymentMethod === "paypal") {
        await createOrderAndRedirectToPayPal();
      }
    } catch (error: any) {
      // Lỗi đã được xử lý trong các hàm riêng
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingFee = shippingMethod === "express" ? 50000 : 0;
  const total = subtotal + shippingFee - (voucher.discount || 0);
  const usdAmount = parseFloat((total / 23000).toFixed(2)); // Tỷ giá tạm

  return (
    <div className="min-h-screen mt-10 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại giỏ hàng
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Thanh toán</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Hoàn tất đơn hàng của bạn
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address Card */}
            <Card className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  Địa chỉ giao hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingAddresses ? (
                  <div className="text-center py-4">
                    <p>Đang tải địa chỉ...</p>
                  </div>
                ) : (
                  <>
                    {shippingAddresses.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-lg font-semibold">
                            Chọn địa chỉ giao hàng
                          </Label>
                          <Link
                            to="/profile?tab=addresses"
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            Quản lý địa chỉ
                          </Link>
                        </div>

                        <Select
                          value={selectedAddressId?.toString() || ""}
                          onValueChange={(value) => {
                            const addressId = value ? Number(value) : null;
                            setSelectedAddressId(addressId);
                            setUseCustomAddress(false);
                          }}
                        >
                          <SelectTrigger className="w-full h-auto min-h-[3rem]">
                            <SelectValue placeholder="Chọn địa chỉ giao hàng">
                              {selectedAddressId && selectedAddress ? (
                                <div className="flex flex-col text-left">
                                  <span className="font-medium truncate">
                                    {selectedAddress.name}
                                  </span>
                                  <span className="text-sm text-gray-600 truncate">
                                    {selectedAddress.fullName} - {selectedAddress.phone}
                                  </span>
                                </div>
                              ) : (
                                "Chọn địa chỉ giao hàng"
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            {shippingAddresses.map((address) => (
                              <SelectItem
                                key={address.id}
                                value={address.id.toString()}
                                className="py-3"
                              >
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">
                                      {address.name}
                                    </span>
                                    {address.isDefault && (
                                      <Badge
                                        variant="secondary"
                                        className="bg-green-100 text-green-800 text-xs px-2 py-0"
                                      >
                                        Mặc định
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-600 space-y-0.5">
                                    <div className="flex items-center gap-1">
                                      <span>{address.fullName}</span>
                                      <span>•</span>
                                      <span>{address.phone}</span>
                                    </div>
                                    <div className="truncate max-w-[200px]">
                                      {address.address}
                                    </div>
                                    {(address.city || address.country) && (
                                      <div>
                                        {address.city}
                                        {address.city && address.country ? ", " : ""}
                                        {address.country}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedAddressId && !useCustomAddress && selectedAddress && (
                      <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-lg">
                                {selectedAddress.name}
                              </span>
                              {selectedAddress.isDefault && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  Mặc định
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p className="font-medium">{selectedAddress.fullName}</p>
                              <p>{selectedAddress.phone}</p>
                              <p>{selectedAddress.address}</p>
                              {selectedAddress.city && selectedAddress.country && (
                                <p>
                                  {selectedAddress.city}, {selectedAddress.country}
                                </p>
                              )}
                              {selectedAddress.email && <p>Email: {selectedAddress.email}</p>}
                              {selectedAddress.desc && (
                                <p className="text-gray-500">Ghi chú: {selectedAddress.desc}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t">
                      {shippingAddresses.length > 0 && (
                        <Button
                          type="button"
                          variant={!useCustomAddress ? "default" : "outline"}
                          onClick={() => setUseCustomAddress(false)}
                          className="flex-1"
                        >
                          Chọn địa chỉ đã lưu
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant={useCustomAddress ? "default" : "outline"}
                        onClick={() => {
                          setUseCustomAddress(true);
                          setSelectedAddressId(null);
                        }}
                        className="flex-1"
                      >
                        Nhập địa chỉ mới
                      </Button>
                    </div>

                    {shippingAddresses.length === 0 && !useCustomAddress && (
                      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                        <p className="text-yellow-800 text-center">
                          Bạn chưa có địa chỉ nào được lưu. Vui lòng nhập địa chỉ mới hoặc{" "}
                          <Link to="/profile?tab=addresses" className="underline font-medium">
                            thêm địa chỉ trong hồ sơ
                          </Link>.
                        </p>
                      </div>
                    )}

                    {useCustomAddress && (
                      <div className="space-y-4 border-t pt-4">
                        <h4 className="font-semibold text-lg">Thông tin địa chỉ mới</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Họ và tên *</Label>
                            <Input
                              id="fullName"
                              placeholder="Nguyễn Văn A"
                              value={formData.fullName}
                              onChange={handleInputChange}
                              className={errors.fullName ? "border-red-500" : ""}
                            />
                            {errors.fullName && (
                              <p className="text-red-500 text-xs">{errors.fullName}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Số điện thoại *</Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="0912345678"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className={errors.phone ? "border-red-500" : ""}
                            />
                            {errors.phone && (
                              <p className="text-red-500 text-xs">{errors.phone}</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="example@email.com"
                            value={formData.email}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Địa chỉ *</Label>
                          <Input
                            id="address"
                            placeholder="Số nhà, tên đường"
                            value={formData.address}
                            onChange={handleInputChange}
                            className={errors.address ? "border-red-500" : ""}
                          />
                          {errors.address && (
                            <p className="text-red-500 text-xs">{errors.address}</p>
                          )}
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">Tỉnh/Thành phố *</Label>
                            <Input
                              id="city"
                              placeholder="Hà Nội"
                              value={formData.city}
                              onChange={handleInputChange}
                              className={errors.city ? "border-red-500" : ""}
                            />
                            {errors.city && (
                              <p className="text-red-500 text-xs">{errors.city}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="district">Quận/Huyện *</Label>
                            <Input
                              id="district"
                              placeholder="Cầu Giấy"
                              value={formData.district}
                              onChange={handleInputChange}
                              className={errors.district ? "border-red-500" : ""}
                            />
                            {errors.district && (
                              <p className="text-red-500 text-xs">{errors.district}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ward">Phường/Xã *</Label>
                            <Input
                              id="ward"
                              placeholder="Dịch Vọng"
                              value={formData.ward}
                              onChange={handleInputChange}
                              className={errors.ward ? "border-red-500" : ""}
                            />
                            {errors.ward && (
                              <p className="text-red-500 text-xs">{errors.ward}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="note">Ghi chú đơn hàng (tùy chọn)</Label>
                          <Textarea
                            id="note"
                            placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn"
                            rows={3}
                            value={formData.note}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="saveInfo"
                            checked={saveInfo}
                            onCheckedChange={(checked) => setSaveInfo(checked as boolean)}
                          />
                          <Label htmlFor="saveInfo" className="text-sm font-normal cursor-pointer">
                            Lưu thông tin địa chỉ này cho lần mua hàng sau
                          </Label>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {errors.shippingAddress && (
                  <p className="text-red-500 text-sm">{errors.shippingAddress}</p>
                )}
              </CardContent>
            </Card>

            {/* Payment Method Card */}
            <Card className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300 delay-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-orange-600" />
                  </div>
                  Phương thức thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <Building className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">Thanh toán khi nhận hàng (COD)</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Thanh toán bằng tiền mặt khi nhận hàng
                          </p>
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-1.646-1.205-4.303-1.787-7.946-1.787H6.734a.732.732 0 0 0-.723.849L8.79 19.037a.732.732 0 0 0 .722.62h3.882a.75.75 0 0 0 .743-.64l.842-5.338c.072-.46.432-.8.896-.8h.57c4.012 0 7.092-1.977 7.93-6.017.11-.527.185-1.102.185-1.68 0-.21-.015-.419-.045-.625z"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">PayPal</p>
                            <Badge variant="outline" className="text-xs">Quốc tế</Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Thanh toán an toàn qua PayPal
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Shield className="w-3 h-3 text-green-600" />
                            <Globe className="w-3 h-3 text-blue-600" />
                            <Lock className="w-3 h-3 text-purple-600" />
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "paypal" && (
                  <Alert className="mt-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                    <AlertDescription className="text-sm">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="font-medium text-blue-800 dark:text-blue-300">
                            Thanh toán bằng PayPal
                          </p>
                          <ul className="mt-1 space-y-1 text-blue-700 dark:text-blue-400">
                            <li className="flex items-center gap-1">
                              <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                              Thanh toán an toàn với tiêu chuẩn bảo mật quốc tế
                            </li>
                            <li className="flex items-center gap-1">
                              <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                              Tỷ giá chuyển đổi: 1 USD ≈ 23,000 VND
                            </li>
                            <li className="flex items-center gap-1">
                              <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                              Bạn sẽ được chuyển đến trang PayPal chính thức để hoàn tất
                            </li>
                          </ul>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              <Card className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
                <CardHeader>
                  <CardTitle>Đơn hàng của bạn</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="w-16 h-16 rounded-lg object-cover bg-gray-100 dark:bg-gray-800"
                          />
                          <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                            {item.quantity}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1">
                            {item.name}
                          </h4>
                          {item.variant && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {item.variant}
                            </p>
                          )}
                          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tạm tính</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>

                    {voucher.code && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Mã giảm giá ({voucher.code})
                        </span>
                        <span className="font-medium text-green-600">
                          -{formatPrice(voucher.discount || 0)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Phí vận chuyển</span>
                      <span className="font-medium">
                        {shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}
                      </span>
                    </div>

                    {paymentMethod === "paypal" && (
                      <>
                        <Separator className="my-2" />
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Chuyển đổi sang USD
                          </span>
                          <span className="font-medium text-blue-600">
                            ≈ {formatUSD(usdAmount)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 text-right">
                          (Tỷ giá: 1 USD ≈ 23,000 VND)
                        </p>
                      </>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng</span>
                    <div className="flex flex-col items-end">
                      <span className="text-blue-600 dark:text-blue-400">
                        {formatPrice(total)}
                      </span>
                      {paymentMethod === "paypal" && (
                        <span className="text-sm text-gray-500 mt-0.5">
                          ≈ {formatUSD(usdAmount)}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 text-base font-medium"
                    onClick={handleCheckout}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang xử lý...
                      </>
                    ) : paymentMethod === "paypal" ? (
                      <>
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-1.646-1.205-4.303-1.787-7.946-1.787H6.734a.732.732 0 0 0-.723.849L8.79 19.037a.732.732 0 0 0 .722.62h3.882a.75.75 0 0 0 .743-.64l.842-5.338c.072-.46.432-.8.896-.8h.57c4.012 0 7.092-1.977 7.93-6.017.11-.527.185-1.102.185-1.68 0-.21-.015-.419-.045-.625z"/>
                        </svg>
                        Thanh toán với PayPal
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Hoàn tất đơn hàng
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    Bằng việc tiến hành đặt hàng, bạn đồng ý với{" "}
                    <Link to="/terms" className="text-blue-600 hover:underline">
                      Điều khoản dịch vụ
                    </Link>{" "}
                    của chúng tôi
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Thanh toán an toàn</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Thông tin của bạn được bảo mật 100%
                      </p>
                    </div>
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

export default CheckoutPage;