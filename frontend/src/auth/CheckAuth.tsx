import { useLocation, Navigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store/store";
import { checkAuth } from "@/store/auth/auth-slice";
import { toast } from "react-toastify";

interface CheckAuthProps {
  children?: ReactNode;
}

const CheckAuth: React.FC<CheckAuthProps> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true); 

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Nếu có token thì check lại auth
      dispatch(checkAuth())
        .unwrap()
        .catch(() => {
          toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại");
          localStorage.removeItem("token");
        })
        .finally(() => setIsChecking(false));
    } else {
      setIsChecking(false);
    }
  }, [dispatch]);

  // Khi đang kiểm tra, chưa render route
  if (isChecking || isLoading) {
    return <div className="flex justify-center items-center h-screen text-lg">Đang kiểm tra đăng nhập...</div>;
  }

  // Nếu chưa đăng nhập, chặn các route cần quyền
  const adminRoutes = [
    "/admin/users",
    "/admin/roles",
    "/admin/attributes",
    "/admin/menus",
    "/admin/voucher",
    "/admin/vouchers",
    "/admin/categories",
    "/admin/products",
    "/admin/language",
    "/admin/languageItem",
    "/admin/languageKey",
    "/admin/products/create",
  ];
  const isAdminRoute =
    adminRoutes.some((route) => location.pathname.startsWith(route)) ||
    location.pathname.match(/^\/products\/edit\/\d+$/);

  // Nếu chưa đăng nhập mà vào route cần quyền
  if (!isAuthenticated && isAdminRoute) {
    toast.error("Vui lòng đăng nhập để truy cập");
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Nếu là admin
  if (isAuthenticated && user?.role.name === "admin") {
    if (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/register") {
      return <Navigate to="/voucher" replace />;
    }
  }

  // Nếu là user thường
  if (isAuthenticated && user?.role.name !== "admin") {
    if (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/register") {
      return <Navigate to="/home" replace />;
    }
  }

  return <>{children}</>;
};

export default CheckAuth;
