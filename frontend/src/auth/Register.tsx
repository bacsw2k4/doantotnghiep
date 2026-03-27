import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDispatch } from "react-redux";
import { registerUser } from "@/store/auth/auth-slice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import type { AppDispatch } from "@/store/store";

interface Errors {
  name?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  general?: string;
}

const Register = () => {
  const [formData, setFormData] = useState({
    role_id: 12,
    name: "",
    firstname: "",
    lastname: "",
    address: "",
    phone: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: Errors = {};

    if (!formData.firstname.trim()) newErrors.firstname = "Họ không được để trống";
    if (!formData.lastname.trim()) newErrors.lastname = "Tên không được để trống";

    if (!formData.phone.trim()) {
      newErrors.phone = "Số điện thoại không được để trống";
    } else if (!/^[0-9]{9,11}$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ (9-11 số)";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email không được để trống";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Mật khẩu không được để trống";
    } else if (formData.password.length < 8) {
      newErrors.password = "Mật khẩu phải ít nhất 8 ký tự";
    }

    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = "Mật khẩu xác nhận không khớp";
    }

    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Tự động cập nhật name khi thay đổi firstname hoặc lastname
      if (name === "firstname" || name === "lastname") {
        newData.name = `${name === "firstname" ? value : prev.firstname} ${
          name === "lastname" ? value : prev.lastname
        }`.trim();
      }

      return newData;
    });

    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      const action: any = await dispatch(registerUser(formData));
      if (action.error) {
        throw new Error(action.payload?.message || "Đăng ký thất bại");
      }

      toast.success("Đăng ký thành công!");
      navigate("/vouchers");
    } catch (err: any) {
      const msg = err.message || "Đăng ký thất bại";
      setErrors({ general: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-lg shadow-lg rounded-xl border border-gray-200 bg-white">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Tạo tài khoản
          </CardTitle>
          <p className="text-sm text-gray-500 mt-2">
            Vui lòng nhập đầy đủ thông tin để đăng ký
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="firstname" className="text-gray-700 font-medium">
                  Họ
                </Label>
                <Input
                  id="firstname"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  placeholder="Nguyễn"
                  className="h-11 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.firstname && (
                  <p className="text-red-600 text-sm mt-1.5">{errors.firstname}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastname" className="text-gray-700 font-medium">
                  Tên
                </Label>
                <Input
                  id="lastname"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  placeholder="Văn A"
                  className="h-11 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.lastname && (
                  <p className="text-red-600 text-sm mt-1.5">{errors.lastname}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-gray-700 font-medium">
                Địa chỉ
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Số nhà, đường, phường/xã..."
                className="h-11 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700 font-medium">
                Số điện thoại
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0912345678"
                className="h-11 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.phone && (
                <p className="text-red-600 text-sm mt-1.5">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="h-11 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1.5">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Mật khẩu
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="h-11 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.password && (
                <p className="text-red-600 text-sm mt-1.5">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password_confirmation"
                className="text-gray-700 font-medium"
              >
                Xác nhận mật khẩu
              </Label>
              <Input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                value={formData.password_confirmation}
                onChange={handleChange}
                placeholder="••••••••"
                className="h-11 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.password_confirmation && (
                <p className="text-red-600 text-sm mt-1.5">
                  {errors.password_confirmation}
                </p>
              )}
            </div>

            {errors.general && (
              <p className="text-red-600 text-center text-sm mt-3 bg-red-50 py-2 rounded-md">
                {errors.general}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors h-11 text-base font-medium mt-3"
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Đăng ký"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Đã có tài khoản?{" "}
            <a
              href="/login"
              className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
            >
              Đăng nhập
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;