import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, List, Star, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import QuickViewModal from "./quick-view-modal";
import { useLanguageItem } from "@/hooks/useLanguageItem";
import { useCart } from "@/hooks/useCart";
import { Skeleton } from "@/components/ui/skeleton"; // Thêm import Skeleton nếu có
import { cn } from "@/lib/utils"; // Thêm import cn

interface LayoutContext {
	selectedLangId: number;
}

interface Product {
	id: number;
	name: string;
	price: number;
	originalPrice?: number;
	rating: number;
	reviews: number;
	image: string;
	badge?: "New" | "Sale" | "Hot";
	discount?: number;
	url: string;
}

interface ApiResponse {
	data: Product[];
	current_page: number;
	last_page: number;
	total: number;
}

const formatPrice = (price: number) => {
	return new Intl.NumberFormat("vi-VN", {
		style: "currency",
		currency: "VND"
	}).format(price);
};

// Component Product Card Skeleton
const ProductCardSkeleton = ({ viewMode }: { viewMode: "grid" | "list" }) => {
	if (viewMode === "list") {
		return (
			<Card className="hover:shadow-lg transition-all duration-300">
				<CardContent className="p-0">
					<div className="flex flex-col sm:flex-row">
						<div className="relative w-full sm:w-48 h-48 sm:h-32 overflow-hidden">
							<Skeleton className="w-full h-full" />
						</div>
						<div className="flex-1 p-4 flex flex-col justify-between">
							<div>
								<Skeleton className="h-6 w-3/4 mb-3" />
								<div className="flex items-center gap-2 mb-2">
									<div className="flex items-center">
										{[...Array(5)].map((_, i) => (
											<Skeleton key={i} className="w-4 h-4 rounded-full" />
										))}
									</div>
									<Skeleton className="h-4 w-24" />
								</div>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex flex-col gap-2">
									<Skeleton className="h-6 w-32" />
									<Skeleton className="h-4 w-24" />
								</div>
								<Skeleton className="h-10 w-32" />
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="hover:shadow-lg transition-all duration-300">
			<CardContent className="p-0">
				<div className="relative aspect-square overflow-hidden rounded-t-lg">
					<Skeleton className="w-full h-full" />
				</div>
				<div className="p-4">
					<Skeleton className="h-6 w-3/4 mb-3" />
					<div className="flex items-center gap-2 mb-3">
						<div className="flex items-center gap-1">
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className="w-4 h-4 rounded-full" />
							))}
						</div>
						<Skeleton className="h-4 w-16" />
					</div>
					<div className="flex flex-col gap-2">
						<Skeleton className="h-6 w-32" />
						<Skeleton className="h-4 w-24" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

// Skeleton cho header và controls
const HeaderSkeleton = () => (
	<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
		<div className="space-y-3">
			<Skeleton className="h-8 w-64" />
			<Skeleton className="h-4 w-96" />
		</div>
		<div className="flex items-center gap-4">
			<Skeleton className="h-10 w-40 rounded-lg" />
			<div className="flex border border-border rounded-lg overflow-hidden">
				<Skeleton className="w-10 h-10 rounded-none" />
				<Skeleton className="w-10 h-10 rounded-none" />
			</div>
		</div>
	</div>
);

// Component ProductCard riêng để tái sử dụng
const ProductCard = ({ 
	product, 
	viewMode, 
	getLanguageItem,
	onAddToCart 
}: { 
	product: Product; 
	viewMode: "grid" | "list";
	getLanguageItem: (key: string, fallback?: string) => string;
	onAddToCart: (e: React.MouseEvent, productId: number) => void;
}) => {
	const handleAddToCart = (e: React.MouseEvent) => {
		onAddToCart(e, product.id);
	};

	if (viewMode === "list") {
		return (
			<Link to={`/product/${product.id}`}>
				<Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
					<CardContent className="p-0">
						<div className="flex flex-col sm:flex-row">
							<div className="relative w-full sm:w-48 h-48 sm:h-32 overflow-hidden">
								<img
									src={product.image || "/placeholder.svg"}
									alt={product.name}
									className="object-cover group-hover:scale-105 transition-transform duration-300"
								/>
								{product.badge && (
									<Badge
										className={`absolute top-2 left-2 ${
											product.badge === "New"
												? "bg-green-500"
												: product.badge === "Sale"
												? "bg-red-500"
												: "bg-orange-500"
										}`}
									>
										{product.badge}
									</Badge>
								)}
								{product.discount && (
									<Badge className="absolute top-2 right-2 bg-red-500">
										-{product.discount}%
									</Badge>
								)}
							</div>
							<div className="flex-1 p-4 flex flex-col justify-between">
								<div>
									<h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
										{product.name}
									</h3>
									<div className="flex items-center gap-2 mb-2">
										<div className="flex items-center">
											{[...Array(5)].map((_, i) => (
												<Star
													key={i}
													className={`w-4 h-4 ${
														i < Math.floor(product.rating)
															? "fill-yellow-400 text-yellow-400"
															: "text-gray-300"
													}`}
												/>
											))}
										</div>
										<span className="text-sm text-muted-foreground">
											{product.rating} ({product.reviews} đánh giá)
										</span>
									</div>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex flex-col">
										<span className="text-xl font-bold text-primary">
											{formatPrice(product.price)}
										</span>
										{product.originalPrice && (
											<span className="text-sm text-muted-foreground line-through">
												{formatPrice(product.originalPrice)}
											</span>
										)}
									</div>
									<Button
										size="sm"
										className="hover:bg-primary/90"
										onClick={handleAddToCart}
									>
										<ShoppingCart className="w-4 h-4 mr-2" />
										{getLanguageItem("btn_add_to_cart", "")}
									</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</Link>
		);
	}

	return (
		<Link to={`/product/${product.url}`}>
			<Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
				<CardContent className="p-0">
					<div className="relative aspect-square overflow-hidden rounded-t-lg">
						<img
							src={product.image || "/placeholder.svg"}
							alt={product.name}
							className="object-cover group-hover:scale-105 transition-transform duration-300"
						/>
						{product.badge && (
							<Badge
								className={`absolute top-2 left-2 ${
									product.badge === "New"
										? "bg-green-500"
										: product.badge === "Sale"
										? "bg-red-500"
										: "bg-orange-500"
								}`}
							>
								{product.badge}
							</Badge>
						)}
						{product.discount && (
							<Badge className="absolute top-2 right-2 bg-red-500">
								-{product.discount}%
							</Badge>
						)}
						<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
							<Button
								size="sm"
								className="bg-white text-black hover:bg-gray-100"
								onClick={handleAddToCart}
							>
								<ShoppingCart className="w-4 h-4 mr-2" />
								{getLanguageItem("btn_add_to_cart", "")}
							</Button>
						</div>
					</div>
					<div className="p-4">
						<h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
							{product.name}
						</h3>
						<div className="flex items-center gap-2 mb-3">
							<div className="flex items-center">
								{[...Array(5)].map((_, i) => (
									<Star
										key={i}
										className={`w-4 h-4 ${
											i < Math.floor(product.rating)
												? "fill-yellow-400 text-yellow-400"
												: "text-gray-300"
										}`}
									/>
								))}
							</div>
							<span className="text-sm text-muted-foreground">
								({product.reviews})
							</span>
						</div>
						<div className="flex items-center justify-between">
							<div className="flex flex-col">
								<span className="text-lg font-bold text-primary">
									{formatPrice(product.price)}
								</span>
								{product.originalPrice && (
									<span className="text-sm text-muted-foreground line-through">
										{formatPrice(product.originalPrice)}
									</span>
								)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
};

export function ProductList() {
	const { selectedLangId } = useOutletContext<LayoutContext>();
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [sortBy, setSortBy] = useState<
		"popular" | "price-low" | "price-high" | "newest"
	>("popular");
	const [products, setProducts] = useState<Product[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [loading, setLoading] = useState(false);
	const [initialLoading, setInitialLoading] = useState(true); // Thêm state cho lần load đầu tiên
	const { getLanguageItem } = useLanguageItem(selectedLangId);
	const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
		null
	);
	const { addToCart } = useCart();
	const navigate = useNavigate();

	const fetchProducts = useCallback(async (reset = false) => {
		if (loading) return;
		
		setLoading(true);
		if (reset) {
			setInitialLoading(true);
		}
		
		try {
			const pageToFetch = reset ? 1 : currentPage;
			
			const response = await axios.get<ApiResponse>(
				"http://localhost:8000/api/shopping/products",
				{
					params: {
						lang_id: selectedLangId,
						sort_by: sortBy,
						page: pageToFetch,
						per_page: 12
					},
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`
					}
				}
			);

			const newProducts = response.data.data;
			
			if (reset) {
				setProducts(newProducts);
			} else {
				setProducts((prev) => [...prev, ...newProducts]);
			}
			
			// Cập nhật trang tiếp theo để load
			const nextPage = response.data.current_page + 1;
			setCurrentPage(nextPage);
			setHasMore(response.data.current_page < response.data.last_page);
		} catch (error: any) {
			toast.error(
				"Không thể tải sản phẩm: " +
					(error.response?.data?.message || error.message)
			);
		} finally {
			setLoading(false);
			if (reset) {
				setInitialLoading(false);
			}
		}
	}, [currentPage, sortBy, selectedLangId, loading]);

	// Fetch sản phẩm khi thay đổi sort hoặc ngôn ngữ
	useEffect(() => {
		setCurrentPage(1);
		setProducts([]);
		fetchProducts(true);
	}, [sortBy, selectedLangId]);

	// Hàm load thêm sản phẩm
	const loadMore = () => {
		if (!loading && hasMore) {
			fetchProducts(false);
		}
	};

	// Hàm xử lý thêm vào giỏ hàng
	const handleAddToCart = async (e: React.MouseEvent, productId: number) => {
		e.preventDefault();
		e.stopPropagation();
		const token = localStorage.getItem("token");

		if (!token) {
			toast.warn("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
			navigate("/login");
			return;
		}
		try {
			await addToCart(productId, 1, [], selectedLangId);
		} catch (error) {
			console.error("Add to cart failed:", error);
		}
	};

	if (initialLoading) {
		const skeletonCount = 12; 

		return (
			<section className="py-16 bg-background">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8">
					<HeaderSkeleton />
					<div
						className={cn(
							"grid gap-6 animate-pulse",
							viewMode === "grid"
								? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
								: "grid-cols-1"
						)}
					>
						{Array.from({ length: skeletonCount }).map((_, index) => (
							<ProductCardSkeleton key={index} viewMode={viewMode} />
						))}
					</div>
				</div>
			</section>
		);
	}

	return (
		<section className="py-16 bg-background">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
					<div>
						<h2 className="text-3xl font-bold mb-2">
							{getLanguageItem("txt_feature_product", "")}
						</h2>
						<p className="text-muted-foreground">
							{getLanguageItem("txt_feature_product_desc", "")}
						</p>
					</div>
					<div className="flex items-center gap-4">
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value as any)}
							className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
						>
							<option value="popular">
								{getLanguageItem("dropdown_best_popular", "")}
							</option>
							<option value="price-low">
								{getLanguageItem("dropdown_price_low_hight", "")}
							</option>
							<option value="price-high">
								{getLanguageItem("dropdown_price_hight_low", "")}
							</option>
							<option value="newest">
								{getLanguageItem("dropdown_latest", "")}
							</option>
						</select>
						<div className="flex border border-border rounded-lg overflow-hidden">
							<Button
								variant={viewMode === "grid" ? "default" : "ghost"}
								size="sm"
								onClick={() => setViewMode("grid")}
								className="rounded-none"
							>
								<Grid3X3 className="w-4 h-4" />
							</Button>
							<Button
								variant={viewMode === "list" ? "default" : "ghost"}
								size="sm"
								onClick={() => setViewMode("list")}
								className="rounded-none"
							>
								<List className="w-4 h-4" />
							</Button>
						</div>
					</div>
				</div>
				
				{/* Product grid */}
				<div
					className={`grid gap-6 ${
						viewMode === "grid"
							? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
							: "grid-cols-1"
					}`}
				>
					{/* Loading khi đang tải thêm */}
					{loading && (
						<>
							{Array.from({ length: 4 }).map((_, index) => (
								<div key={`loading-${index}`} className="opacity-50">
									<ProductCardSkeleton viewMode={viewMode} />
								</div>
							))}
						</>
					)}

					{/* Danh sách sản phẩm */}
					{products.length > 0 ? (
						products.map((product) => (
							<div
								key={product.id}
								className={cn(
									"transition-opacity duration-300",
									loading ? "opacity-50" : "opacity-100"
								)}
							>
								<ProductCard
									product={product}
									viewMode={viewMode}
									getLanguageItem={getLanguageItem}
									onAddToCart={handleAddToCart}
								/>
							</div>
						))
					) : !loading ? (
						<div className="col-span-full text-center py-12">
							<div className="text-muted-foreground text-lg">
								Không có sản phẩm nào để hiển thị.
							</div>
						</div>
					) : null}
				</div>
				
				{/* Nút load more */}
				{hasMore && (
					<div className="text-center mt-12">
						<Button
							size="lg"
							variant="outline"
							className="hover:bg-primary hover:text-primary-foreground bg-transparent min-w-48"
							onClick={loadMore}
							disabled={loading}
						>
							{loading ? (
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
									<span>{getLanguageItem("txt_loading", "")}...</span>
								</div>
							) : (
								getLanguageItem("txt_watch_more", "")
							)}
						</Button>
					</div>
				)}
			</div>

			{quickViewProduct && (
				<QuickViewModal
					product={quickViewProduct}
					onClose={() => setQuickViewProduct(null)}
					selectedLangId={selectedLangId}
				/>
			)}
		</section>
	);
}