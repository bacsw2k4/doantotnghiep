import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useState } from "react";
import Register from "./auth/Register";
import Login from "./auth/Login";
import UserManagement from "./admin-view/User/UserManagement";
import RoleManagement from "./admin-view/Role/RoleManagement";
import AdminLayout from "./admin-view/layout";
import AttributeManagement from "./admin-view/Attribute/AttributeManagement";
import MenuManagement from "./admin-view/Menu/MenuManagement";
import CategoryManagement from "./admin-view/Category/CategoryManagement";
import ProductManagement from "./admin-view/Product/ProductManagement";
import ProductDetail from "./admin-view/Product/components/ProductDetail";
import ProductForm from "./admin-view/Product/components/ProductForm";
import LanguageKeyManagement from "./admin-view/Language/LanguageKeyManagement";
import LanguageItemManagement from "./admin-view/Language/LanguageItemManagement";
import LanguageManagement from "./admin-view/Language/LanguageManagement";
import VoucherManagement from "./admin-view/Voucher/VoucherManagement";
import CheckAuth from "./auth/CheckAuth";
import Layout from "./shopping-view/Layout";
import CategoryPage from "./shopping-view/category/CategoryPage";
import ProductDetailPage from "./shopping-view/product/ProductPage";
import CheckoutPage from "./shopping-view/checkout/CheckoutPage";
import CartPage from "./shopping-view/cart/CartPage";
import ProfilePage from "./shopping-view/profile/ProfilePage";
import BannerManagement from "./admin-view/Banner/BannerManagement";
import FooterManagement from "./admin-view/Footer/FooterManagement";
import OrderManagement from "./admin-view/Order/OrderManagement";
import OrderDetail from "./admin-view/Order/OrderDetail";
import { AdminDashboard } from "./admin-view/Dashboard/Dashboard";
import PromotionSubscriberManagement from "./admin-view/PromotionSubscriber/PromotionSubscriberManagement";
import Home from "./shopping-view/home/Home";
import ReviewManagement from "./admin-view/Review/ReviewManagement";
import PaymentSuccessPage from "./shopping-view/payment/PaymentSuccessPage";
import PaymentCancelPage from "./shopping-view/payment/PaymentCancelPage";

interface LayoutContext {
	selectedLangId: number;
	setSelectedLangId: React.Dispatch<React.SetStateAction<number>>;
}

// Route Guard Component
const ProtectedRoute = ({
	children,
	requireAuth = false
}: {
	children: React.ReactNode;
	requireAuth?: boolean;
}) => {
	const token = localStorage.getItem("token");
	const location = useLocation();

	if (requireAuth && !token) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return <>{children}</>;
};

// Admin Route Guard
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
	const token = localStorage.getItem("token");
	const userRole = localStorage.getItem("userRole");
	const location = useLocation();

	if (!token) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}


	return <>{children}</>;
};

function App() {
	const [selectedLangId, setSelectedLangId] = useState<number>(1);

	const layoutContext: LayoutContext = {
		selectedLangId,
		setSelectedLangId
	};

	return (
		<Routes>
			{/* Public Routes */}
			<Route path="/register" element={<Register />} />
			<Route path="/login" element={<Login />} />
			<Route path="/payment/success" element={<PaymentSuccessPage />} />
			<Route path="/payment/cancel" element={<PaymentCancelPage />} />

			{/* Shopping Routes with Layout */}
			<Route element={<Layout context={layoutContext} />}>
				<Route path="/" element={<Home />} />
				<Route path="/categories" element={<CategoryPage />} />
				<Route path="/product/:slug" element={<ProductDetailPage />} />
				<Route path="/cart" element={<CartPage selectedLangId={selectedLangId} />} />

				{/* Protected Shopping Routes */}
				<Route
					path="/checkout"
					element={
						<ProtectedRoute requireAuth>
							<CheckoutPage selectedLangId={selectedLangId} />
						</ProtectedRoute>
					}
				/>

				<Route
					path="/profile"
					element={
						<ProtectedRoute requireAuth>
							<ProfilePage />
						</ProtectedRoute>
					}
				/>
			</Route>

			{/* Admin Routes */}
			<Route
				path="/admin"
				element={
					<AdminRoute>
						<CheckAuth>
							<AdminLayout />
						</CheckAuth>
					</AdminRoute>
				}
			>
				<Route path="dashboard" element={<AdminDashboard />} />
				<Route path="users" element={<UserManagement />} />
				<Route path="roles" element={<RoleManagement />} />
				<Route path="attributes" element={<AttributeManagement />} />
				<Route path="menus" element={<MenuManagement />} />
				<Route path="categories" element={<CategoryManagement />} />
				<Route path="products" element={<ProductManagement />} />
				<Route path="products/:id" element={<ProductDetail />} />
				<Route path="products/create" element={<ProductForm />} />
				<Route path="products/edit/:id" element={<ProductForm />} />
				<Route path="orders" element={<OrderManagement />} />
				<Route path="orders/:id" element={<OrderDetail />} />
				<Route path="banners" element={<BannerManagement />} />
				<Route path="footers" element={<FooterManagement />} />
				<Route path="vouchers" element={<VoucherManagement />} />
				<Route path="review" element={<ReviewManagement />} />
				<Route path="language" element={<LanguageManagement />} />
				<Route path="languageItem" element={<LanguageItemManagement />} />
				<Route path="languageKey" element={<LanguageKeyManagement />} />
				<Route
					path="promotionSubscriber"
					element={<PromotionSubscriberManagement />}
				/>
			</Route>

			{/* 404 Page */}
			<Route
				path="*"
				element={
					<div className="min-h-screen flex items-center justify-center">
						<div className="text-center">
							<h1 className="text-4xl font-bold mb-4">404</h1>
							<p className="text-gray-600">Page not found</p>
							<a
								href="/"
								className="text-blue-600 hover:underline mt-4 inline-block"
							>
								Go back home
							</a>
						</div>
					</div>
				}
			/>
		</Routes>
	);
}

export default App;
