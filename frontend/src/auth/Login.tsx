import { useState } from "react";
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDispatch } from "react-redux";
import { loginUser } from "@/store/auth/auth-slice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import type { AppDispatch } from "@/store/store";

interface Errors {
  email?: string;
  password?: string;
  general?: string;
}

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: Errors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email không được để trống";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Mật khẩu không được để trống";
    }
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setLoading(true);
      const action: any = await dispatch(loginUser(formData));
      if (action.error) {
        throw new Error(action.payload.message || "Đăng nhập thất bại");
      }

      const roleName = action.payload.user.role.name;

      toast.success("Đăng nhập thành công");

      if (roleName.toLowerCase() === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setErrors({ general: err.message || "Đăng nhập thất bại" });
      toast.error(err.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg rounded-xl border border-gray-200 bg-white">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Đăng nhập
          </CardTitle>
          <p className="text-sm text-gray-500 mt-2">
            Nhập thông tin để truy cập tài khoản
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
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

            {errors.general && (
              <p className="text-red-600 text-center text-sm mt-3 bg-red-50 py-2 rounded-md">
                {errors.general}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors h-11 text-base font-medium mt-2"
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Chưa có tài khoản?{" "}
            <a
              href="/register"
              className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
            >
              Đăng ký ngay
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;