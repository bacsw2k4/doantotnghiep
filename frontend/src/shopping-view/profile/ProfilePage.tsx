import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  MapPin,
  Package,
  Settings,
  Camera,
  Edit,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Save,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Truck,
  Clock,
  XCircle,
  CheckCheck,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getProfile, updateProfile, uploadAvatar, getShippingAddresses, addShippingAddress, updateShippingAddress, deleteShippingAddress, getOrders } from "@/store/auth/auth-slice";
import { toast } from "react-toastify";
import type { RootState, AppDispatch } from "@/store/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Address {
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

interface OrderDetail {
  productId: number;
  productName: string;
  price: string;
  volume: number;
  totalPrice: string;
  image: string | null;
  attributes: { id: number; name: string }[];
}

interface Order {
  id: number;
  orderCode: string;
  date: string;
  total: string;
  status: string; // Status từ API có thể là 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
  items: number;
  image: string | null;
  details: OrderDetail[];
}

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [editingAddress, setEditingAddress] = useState<number | null>(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [addressFormData, setAddressFormData] = useState({
    name: "",
    fullName: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    email: "",
    desc: "",
    isDefault: false,
  });
  const [addressErrors, setAddressErrors] = useState<{ [key: string]: string | undefined }>({});
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated, addresses, orders } = useSelector((state: RootState) => state.auth);

  // Component hiển thị badge status dựa trên status từ API
  const StatusBadge = ({ status }: { status: string }) => {
    // Format label: viết hoa chữ cái đầu
    const formatLabel = (status: string) => {
      if (!status) return "Unknown";
      return status.charAt(0).toUpperCase() + status.slice(1);
    };

    // Mapping status với icon và class tương ứng
    const getStatusConfig = (status: string) => {
      const statusMap = {
        pending: { icon: Clock, className: "bg-gray-100 text-gray-700" },
        confirmed: { icon: CheckCircle2, className: "bg-blue-100 text-blue-700" },
        processing: { icon: Clock, className: "bg-yellow-100 text-yellow-700" },
        shipped: { icon: Truck, className: "bg-purple-100 text-purple-700" },
        delivered: { icon: CheckCheck, className: "bg-green-100 text-green-700" },
        cancelled: { icon: XCircle, className: "bg-red-100 text-red-700" },
      };

      // Nếu status có trong mapping, dùng config đó
      if (statusMap[status as keyof typeof statusMap]) {
        return statusMap[status as keyof typeof statusMap];
      }

      // Mặc định nếu không tìm thấy
      return {
        icon: AlertCircle,
        className: "bg-gray-100 text-gray-700"
      };
    };

    const config = getStatusConfig(status);
    const Icon = config.icon;
    const label = formatLabel(status);
    
    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  // Hàm kiểm tra có thể mua lại không (chỉ cho các status đã hoàn thành)
  const canBuyAgain = (status: string): boolean => {
    const lowerStatus = status.toLowerCase();
    return lowerStatus === 'delivered' || lowerStatus === 'shipped';
  };

  useEffect(() => {
    dispatch(getProfile())
      .unwrap()
      .catch((err) => {
        toast.error(err.message || "Không thể tải thông tin cá nhân");
        navigate("/login");
      });
    dispatch(getShippingAddresses())
      .unwrap()
      .catch((err) => {
        toast.error(err.message || "Không thể tải danh sách địa chỉ");
      });
    dispatch(getOrders())
      .unwrap()
      .catch((err) => {
        toast.error(err.message || "Không thể tải danh sách đơn hàng");
      });
  }, [dispatch, navigate, isAuthenticated]);

  useEffect(() => {
    if (user && user.fullName) {
      setFormData({
        firstname: user.fullName.split(" ")[0] || "",
        lastname: user.fullName.split(" ").slice(1).join(" ") || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/jpg", "image/gif"].includes(file.type)) {
      toast.error("Vui lòng chọn file ảnh (jpeg, png, jpg, gif)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File ảnh không được vượt quá 2MB");
      return;
    }

    try {
      await dispatch(uploadAvatar(file)).unwrap();
      toast.success("Cập nhật avatar thành công");
    } catch (err: any) {
      toast.error(err.message || "Cập nhật avatar thất bại");
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setAddressFormData({
      ...addressFormData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
    setAddressErrors({ ...addressErrors, [name]: undefined });
  };

  const validateAddressForm = () => {
    const newErrors: { [key: string]: string | undefined } = {};
    if (!addressFormData.name.trim()) {
      newErrors.name = "Tên địa chỉ không được để trống";
    }
    if (!addressFormData.fullName.trim()) {
      newErrors.fullName = "Họ tên không được để trống";
    }
    if (!addressFormData.phone.trim()) {
      newErrors.phone = "Số điện thoại không được để trống";
    } else if (!/^[0-9]{9,11}$/.test(addressFormData.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }
    if (!addressFormData.address.trim()) {
      newErrors.address = "Địa chỉ không được để trống";
    }
    if (addressFormData.email && !/\S+@\S+\.\S+/.test(addressFormData.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    return newErrors;
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validateAddressForm();
    if (Object.keys(newErrors).length > 0) {
      setAddressErrors(newErrors);
      return;
    }

    try {
      if (editingAddress) {
        await dispatch(updateShippingAddress({ id: editingAddress, address: addressFormData })).unwrap();
        toast.success("Cập nhật địa chỉ thành công");
      } else {
        await dispatch(addShippingAddress(addressFormData)).unwrap();
        toast.success("Thêm địa chỉ thành công");
      }
      setAddressFormData({
        name: "",
        fullName: "",
        phone: "",
        address: "",
        city: "",
        country: "",
        email: "",
        desc: "",
        isDefault: false,
      });
      setEditingAddress(null);
      setShowAddAddressForm(false);
      setAddressErrors({});
    } catch (err: any) {
      const errorMessage = err.errors
        ? Object.values(err.errors).flat().join(", ")
        : err.message || "Thao tác thất bại";
      setAddressErrors({ general: errorMessage });
      toast.error(errorMessage);
    }
  };

  const handleEditAddress = (address: Address) => {
    setAddressFormData({
      name: address.name,
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      city: address.city || "",
      country: address.country || "",
      email: address.email || "",
      desc: address.desc || "",
      isDefault: address.isDefault,
    });
    setEditingAddress(address.id);
    setShowAddAddressForm(true);
  };

  const handleDeleteAddress = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
    
    try {
      await dispatch(deleteShippingAddress(id)).unwrap();
      toast.success("Xóa địa chỉ thành công");
    } catch (err: any) {
      toast.error(err.message || "Xóa địa chỉ thất bại");
    }
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleBuyAgain = async (order: Order) => {
    try {
      toast.info(`Đã thêm ${order.items} sản phẩm từ đơn hàng ${order.orderCode} vào giỏ hàng!`);
      navigate("/cart");
    } catch (err: any) {
      toast.error(err.message || "Không thể thêm sản phẩm vào giỏ hàng");
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string | undefined } = {};
    if (!formData.firstname.trim()) {
      newErrors.firstname = "Họ không được để trống";
    }
    if (!formData.lastname.trim()) {
      newErrors.lastname = "Tên không được để trống";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email không được để trống";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Số điện thoại không được để trống";
    }
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await dispatch(updateProfile(formData)).unwrap();
      toast.success("Cập nhật thông tin thành công");
    } catch (err: any) {
      const errorMessage = err.errors
        ? Object.values(err.errors).flat().join(", ")
        : err.message || "Cập nhật thông tin thất bại";
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 animate-fade-in-up">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <Avatar className="w-24 h-24 border-4 border-blue-500">
                <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.fullName} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  {user?.fullName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <button
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/jpeg,image/png,image/jpg,image/gif"
                className="hidden"
              />
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{user?.fullName}</h1>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {user?.phone}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Tham gia: {user?.joinDate}
                </div>
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  Đơn hàng: {user?.totalOrders}
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-4 h-4">₫</span>
                  Tổng chi tiêu: {user?.totalSpent}₫
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 bg-white p-2 rounded-xl shadow-md">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Thông tin</span>
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Địa chỉ</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Đơn hàng</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Cài đặt</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 animate-fade-in-up">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
                <CardDescription>Cập nhật thông tin tài khoản của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstname">Họ</Label>
                      <Input
                        id="firstname"
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleChange}
                        placeholder="Họ"
                      />
                      {errors.firstname && <p className="text-red-500 text-sm mt-1">{errors.firstname}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastname">Tên</Label>
                      <Input
                        id="lastname"
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleChange}
                        placeholder="Tên"
                      />
                      {errors.lastname && <p className="text-red-500 text-sm mt-1">{errors.lastname}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        disabled
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+84 123 456 789"
                      />
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Địa chỉ</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Địa chỉ"
                      />
                      {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                    </div>
                  </div>
                  {errors.general && <p className="text-red-500 text-center text-sm mt-2">{errors.general}</p>}
                  <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses" className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Địa chỉ của tôi</h2>
              <Button onClick={() => { 
                setShowAddAddressForm(true); 
                setEditingAddress(null); 
                setAddressFormData({ 
                  name: "", fullName: "", phone: "", address: "", 
                  city: "", country: "", email: "", desc: "", isDefault: false 
                }); 
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm địa chỉ mới
              </Button>
            </div>

            {showAddAddressForm && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingAddress ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddressSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Tên địa chỉ</Label>
                        <Input
                          id="name"
                          name="name"
                          value={addressFormData.name}
                          onChange={handleAddressChange}
                          placeholder="Ví dụ: Nhà riêng"
                        />
                        {addressErrors.name && <p className="text-red-500 text-sm mt-1">{addressErrors.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Họ tên</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={addressFormData.fullName}
                          onChange={handleAddressChange}
                          placeholder="Họ tên người nhận"
                        />
                        {addressErrors.fullName && <p className="text-red-500 text-sm mt-1">{addressErrors.fullName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={addressFormData.phone}
                          onChange={handleAddressChange}
                          placeholder="+84 123 456 789"
                        />
                        {addressErrors.phone && <p className="text-red-500 text-sm mt-1">{addressErrors.phone}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Địa chỉ</Label>
                        <Input
                          id="address"
                          name="address"
                          value={addressFormData.address}
                          onChange={handleAddressChange}
                          placeholder="Số nhà, đường"
                        />
                        {addressErrors.address && <p className="text-red-500 text-sm mt-1">{addressErrors.address}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Thành phố</Label>
                        <Input
                          id="city"
                          name="city"
                          value={addressFormData.city}
                          onChange={handleAddressChange}
                          placeholder="Thành phố"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Quốc gia</Label>
                        <Input
                          id="country"
                          name="country"
                          value={addressFormData.country}
                          onChange={handleAddressChange}
                          placeholder="Quốc gia"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={addressFormData.email}
                          onChange={handleAddressChange}
                          placeholder="you@example.com"
                        />
                        {addressErrors.email && <p className="text-red-500 text-sm mt-1">{addressErrors.email}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="desc">Mô tả</Label>
                        <Input
                          id="desc"
                          name="desc"
                          value={addressFormData.desc}
                          onChange={handleAddressChange}
                          placeholder="Ghi chú thêm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="isDefault">Đặt làm mặc định</Label>
                        <input
                          id="isDefault"
                          name="isDefault"
                          type="checkbox"
                          checked={addressFormData.isDefault}
                          onChange={handleAddressChange}
                          className="h-4 w-4"
                        />
                      </div>
                    </div>
                    {addressErrors.general && <p className="text-red-500 text-center text-sm mt-2">{addressErrors.general}</p>}
                    <div className="flex gap-2">
                      <Button type="submit" disabled={isLoading}>
                        <Save className="w-4 h-4 mr-2" />
                        {isLoading ? "Đang lưu..." : editingAddress ? "Cập nhật" : "Thêm"}
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddAddressForm(false)}>
                        Hủy
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.length === 0 ? (
                <p className="text-center text-gray-600 col-span-full">Bạn chưa có địa chỉ nào.</p>
              ) : (
                addresses.map((address) => (
                  <Card key={address.id} className="relative hover:shadow-lg transition-shadow">
                    {address.isDefault && <Badge className="absolute top-4 right-4 bg-blue-600">Mặc định</Badge>}
                    <CardHeader>
                      <CardTitle className="text-lg">{address.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm">
                        <p className="font-semibold">{address.fullName}</p>
                        <p className="text-gray-600">{address.phone}</p>
                        <p className="text-gray-600 mt-2">{address.address}</p>
                        <p className="text-gray-600">{address.city}</p>
                        <p className="text-gray-600">{address.country}</p>
                        {address.email && <p className="text-gray-600">Email: {address.email}</p>}
                        {address.desc && <p className="text-gray-600">Ghi chú: {address.desc}</p>}
                      </div>
                      <Separator className="my-4" />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => handleEditAddress(address)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Sửa
                        </Button>
                        {!address.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent"
                            onClick={() => handleDeleteAddress(address.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Xóa
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Đơn hàng gần đây</h2>
              <Link to="/orders">
                <Button variant="outline">Xem tất cả</Button>
              </Link>
            </div>
            <div className="space-y-4">
              {orders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có đơn hàng</h3>
                    <p className="text-gray-600 mb-4">Bạn chưa có đơn hàng nào. Hãy mua sắm ngay!</p>
                    <Link to="/">
                      <Button>Bắt đầu mua sắm</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                orders.map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <img
                          src={order.image || "/placeholder.svg"}
                          alt="Product"
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap justify-between items-start gap-2">
                            <div>
                              <p className="font-semibold text-lg">Đơn hàng #{order.orderCode}</p>
                              <p className="text-sm text-gray-600">Ngày đặt: {order.date}</p>
                            </div>
                            <StatusBadge status={order.status} />
                          </div>
                          <div className="flex flex-wrap justify-between items-center gap-4">
                            <div className="text-sm text-gray-600">
                              <span>{order.items} sản phẩm</span>
                              <span className="mx-2">•</span>
                              <span className="font-semibold text-blue-600">{order.total}₫</span>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleViewOrderDetails(order)}
                              >
                                Xem chi tiết
                              </Button>
                              {canBuyAgain(order.status) && (
                                <Button size="sm" onClick={() => handleBuyAgain(order)}>
                                  Mua lại
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          <TabsContent value="settings" className="space-y-6 animate-fade-in-up">
            <Card>
              <CardHeader>
                <CardTitle>Đổi mật khẩu</CardTitle>
                <CardDescription>Cập nhật mật khẩu để bảo mật tài khoản</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Mật khẩu hiện tại</Label>
                  <div className="relative">
                    <Input
                      id="oldPassword"
                      type={showOldPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Mật khẩu mới</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu mới"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                  <Input id="confirmPassword" type="password" placeholder="Nhập lại mật khẩu mới" />
                </div>
                <Button onClick={() => toast.info("Chức năng đổi mật khẩu sẽ được triển khai sau")}>
                  <Save className="w-4 h-4 mr-2" />
                  Cập nhật mật khẩu
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chi tiết đơn hàng #{selectedOrder?.orderCode}</DialogTitle>
              <DialogDescription>Thông tin chi tiết về đơn hàng của bạn</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">Ngày đặt: {selectedOrder?.date}</p>
                {selectedOrder && <StatusBadge status={selectedOrder.status} />}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Sản phẩm trong đơn hàng</h3>
                <div className="space-y-3">
                  {selectedOrder?.details.map((detail, index) => (
                    <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <img
                        src={detail.image || "/placeholder.svg"}
                        alt={detail.productName}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{detail.productName}</p>
                        {detail.attributes.length > 0 && (
                          <p className="text-sm text-gray-600 mb-2">
                            Thuộc tính: {detail.attributes.map((attr) => attr.name).join(", ")}
                          </p>
                        )}
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-600">Số lượng: {detail.volume}</p>
                          <p className="text-gray-600">Đơn giá: {detail.price}₫</p>
                          <p className="font-semibold text-blue-600">Tổng: {detail.totalPrice}₫</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Tổng cộng</span>
                  <span className="text-blue-600">{selectedOrder?.total}₫</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setSelectedOrder(null)}
                >
                  Đóng
                </Button>
                {selectedOrder && canBuyAgain(selectedOrder.status) && (
                  <Button className="flex-1" onClick={() => handleBuyAgain(selectedOrder)}>
                    Mua lại đơn hàng này
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <footer className="bg-gray-100 dark:bg-gray-800 py-8 text-center mt-12">
        <p className="text-gray-600 dark:text-gray-400">
          © 2025 Your E-commerce. All rights reserved.
        </p>
      </footer>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;