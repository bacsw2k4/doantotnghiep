import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart } from "lucide-react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import QuickViewModal from "./quick-view-modal";
import { useLanguageItem } from "@/hooks/useLanguageItem";
import { useCart } from "@/hooks/useCart";
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
	hoverImage: string;
	badge?: string;
	category: string;
	url: string;
}

interface Category {
	id: number;
	name: string;
}

interface CategoryData {
	products: Product[];
	current_page: number;
	last_page: number;
	total: number;
}

interface PairData {
	categories: Category[];
	products: { [key: string]: CategoryData };
}

interface ApiResponse {
	data: PairData[];
	total_pairs: number;
}

const formatPrice = (price: number) => {
	return new Intl.NumberFormat("vi-VN", {
		style: "currency",
		currency: "VND"
	}).format(price);
};

// Skeleton cho product card
const ProductCardSkeleton = () => (
	<Card className="overflow-hidden border-0 shadow-md animate-pulse bg-card cursor-pointer">
		<CardContent className="p-0">
			<div className="relative overflow-hidden aspect-square">
				<div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
				<div className="absolute top-3 left-3 z-10">
					<div className="w-12 h-6 bg-gray-400 rounded-full" />
				</div>
				<div className="absolute inset-0 bg-black/20 flex items-center justify-center">
					<div className="w-28 h-10 bg-gray-400 rounded-lg" />
				</div>
			</div>
			<div className="p-4 space-y-3">
				<div className="space-y-2">
					<div className="h-4 bg-gray-300 rounded w-3/4" />
					<div className="h-4 bg-gray-300 rounded w-1/2" />
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1">
						{[...Array(5)].map((_, i) => (
							<div key={i} className="w-4 h-4 bg-gray-300 rounded-full" />
						))}
					</div>
					<div className="h-3 w-20 bg-gray-300 rounded" />
				</div>
				<div className="flex items-center gap-2">
					<div className="h-6 w-24 bg-gray-300 rounded" />
					<div className="h-4 w-16 bg-gray-300 rounded" />
				</div>
				<div className="w-full h-10 bg-gray-300 rounded-lg mt-3" />
			</div>
		</CardContent>
	</Card>
);

// Skeleton cho category tabs
const CategoryTabsSkeleton = () => (
	<div className="flex justify-center mb-8">
		<div className="bg-muted p-1 rounded-lg inline-flex gap-2 animate-pulse">
			{[1, 2].map((i) => (
				<div key={i} className="px-8 py-3 bg-gray-300 rounded-md w-32" />
			))}
		</div>
	</div>
);

// Header skeleton
const HeaderSkeleton = () => (
	<div className="text-center mb-12 animate-pulse">
		<div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4" />
		<div className="space-y-2 max-w-2xl mx-auto">
			<div className="h-4 bg-gray-300 rounded w-full" />
			<div className="h-4 bg-gray-300 rounded w-5/6 mx-auto" />
			<div className="h-4 bg-gray-300 rounded w-4/6 mx-auto" />
		</div>
	</div>
);

export function DualCategoryProducts() {
	const { selectedLangId } = useOutletContext<LayoutContext>();
	const [pairs, setPairs] = useState<PairData[]>([]);
	const [activeCategories, setActiveCategories] = useState<string[]>([]);
	const [categoryPages, setCategoryPages] = useState<{ [key: number]: number }>(
		{}
	);
	const [loading, setLoading] = useState(false);
	const [initialLoading, setInitialLoading] = useState(true);
	const { getLanguageItem } = useLanguageItem(selectedLangId);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [loadMoreLoading, setLoadMoreLoading] = useState<number | null>(null);
	const { addToCart } = useCart();
	const navigate = useNavigate();

	const fetchProducts = async (
		newCategoryPages: { [key: number]: number } = {},
		isLoadMore = false
	) => {
		if (isLoadMore) {
			setLoadMoreLoading(Object.keys(newCategoryPages)[0] as unknown as number);
		} else {
			setLoading(true);
			if (!isLoadMore) {
				setInitialLoading(true);
			}
		}

		try {
			const response = await axios.get<ApiResponse>(
				"http://localhost:8000/api/shopping/dual-category-products",
				{
					params: {
						lang_id: selectedLangId,
						category_pages: newCategoryPages
					},
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`
					}
				}
			);

			console.log("API Response:", response.data); // <-- Thêm log này
			console.log("Total pairs:", response.data.total_pairs);
			console.log("Filtered pairs:", response.data.data);

			const filteredPairs = response.data.data.filter((pair) => {
				return (
					Object.keys(pair.products).length > 0 &&
					Object.values(pair.products).some((data) => data.products.length > 0)
				);
			});

			setPairs(filteredPairs);

			setActiveCategories((prev) =>
				filteredPairs.map((pair, index) => {
					const categoryWithProducts = Object.keys(pair.products).find(
						(categoryName) => pair.products[categoryName]?.products?.length > 0
					);
					return prev[index] || categoryWithProducts || "";
				})
			);

			setCategoryPages((prev) => ({
				...prev,
				...Object.fromEntries(
					filteredPairs
						.flatMap((pair) => pair.categories)
						.map((category) => [
							category.id,
							newCategoryPages[category.id] || prev[category.id] || 1
						])
				)
			}));
		} catch (error: any) {
			toast.error(
				"Không thể tải sản phẩm: " +
					(error.response?.data?.message || error.message)
			);
			console.error("Error fetching products:", error);
			setPairs([]);
		} finally {
			setLoading(false);
			setLoadMoreLoading(null);
			if (!isLoadMore) {
				setInitialLoading(false);
			}
		}
	};

	useEffect(() => {
		setCategoryPages({});
		setActiveCategories([]);
		fetchProducts({}, false);
	}, [selectedLangId]);

	const handleLoadMore = (categoryId: number) => {
		setCategoryPages((prev) => {
			const newPages = { ...prev, [categoryId]: (prev[categoryId] || 1) + 1 };
			fetchProducts(newPages, true);
			return newPages;
		});
	};

	const handleCategoryChange = (pairIndex: number, categoryName: string) => {
		if (loading || loadMoreLoading) return; // Prevent changing during loading
		setActiveCategories((prev) => {
			const newActive = [...prev];
			newActive[pairIndex] = categoryName;
			return newActive;
		});
	};

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
			toast.success("Đã thêm vào giỏ hàng!");
		} catch (error: any) {
			toast.error(
				"Không thể thêm vào giỏ hàng: " +
					(error.response?.data?.message || error.message)
			);
		}
	};

	const handleQuickView = (e: React.MouseEvent, product: Product) => {
		e.preventDefault();
		e.stopPropagation();
		setSelectedProduct(product);
	};

	const renderProductCard = (product: Product, index: number) => (
		<Link key={product.id} to={`/product/${product.url}`}>
			<Card
				className={cn(
					"group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-500 bg-card cursor-pointer",
					loadMoreLoading && "opacity-70"
				)}
			>
				<CardContent className="p-0">
					<div className="relative overflow-hidden aspect-square">
						<img
							src={product.image || "/placeholder.svg"}
							alt={product.name}
							className="w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
						/>
						<img
							src={product.hoverImage || product.image || "/placeholder.svg"}
							alt={`${product.name} hover`}
							className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
						/>
						{product.badge && (
							<Badge
								className={`absolute top-3 left-3 z-10 ${
									product.badge === "Hot"
										? "bg-red-500 hover:bg-red-600"
										: product.badge === "New"
										? "bg-green-500 hover:bg-green-600"
										: "bg-orange-500 hover:bg-orange-600"
								}`}
							>
								{product.badge}
							</Badge>
						)}
						<div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
							<Button
								variant="secondary"
								className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
								onClick={(e) => handleQuickView(e, product)}
							>
								{getLanguageItem("txt_quick_view", "")}
							</Button>
						</div>
					</div>
					<div className="p-4 space-y-3">
						<h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2">
							{product.name}
						</h3>
						<div className="flex items-center gap-2">
							<div className="flex items-center">
								{[...Array(5)].map((_, i) => (
									<Star
										key={i}
										className={`h-4 w-4 ${
											i < Math.floor(product.rating)
												? "text-yellow-400 fill-current"
												: "text-gray-300"
										}`}
									/>
								))}
							</div>
							<span className="text-sm text-muted-foreground">
								{product.rating} ({product.reviews})
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-lg font-bold text-primary">
								{formatPrice(product.price)}
							</span>
							{product.originalPrice && (
								<span className="text-sm text-muted-foreground line-through">
									{formatPrice(product.originalPrice)}
								</span>
							)}
						</div>
						<Button
							className="w-full mt-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
							onClick={(e) => handleAddToCart(e, product.id)}
						>
							<ShoppingCart className="h-4 w-4 mr-2" />
							{getLanguageItem("btn_add_to_cart", "")}
						</Button>
					</div>
				</CardContent>
			</Card>
		</Link>
	);

	const visiblePairs = pairs.filter((pair) => {
		// Lọc các category có sản phẩm
		const categoriesWithProducts = pair.categories.filter(
			(category) => pair.products[category.name]?.products?.length > 0
		);

		// Hiển thị nếu có ít nhất 1 category có sản phẩm
		return categoriesWithProducts.length >= 1; // <-- Thay đổi từ 2 thành 1
	});

	// Hiển thị loading cho lần đầu
	if (initialLoading) {
		return (
			<section className="py-16 bg-gradient-to-b from-background to-muted/20">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8">
					<HeaderSkeleton />

					{/* Loading cho 2 cặp category */}
					{[1, 2].map((pairIndex) => (
						<div key={pairIndex} className="space-y-16 mb-16">
							<CategoryTabsSkeleton />

							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
								{[1, 2, 3, 4].map((index) => (
									<ProductCardSkeleton key={index} />
								))}
							</div>

							{/* Skeleton cho nút load more */}
							<div className="text-center mt-8">
								<div className="w-48 h-12 bg-gray-300 rounded-lg mx-auto" />
							</div>
						</div>
					))}
				</div>
			</section>
		);
	}

	if (visiblePairs.length === 0 && !loading) {
		return null; // Không hiển thị component nếu không có sản phẩm nào
	}

	return (
		<section className="pb-8 bg-gradient-to-b from-background to-muted/20">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-12">
					<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
						{getLanguageItem("txt_product_by_category", "")}
					</h2>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						{getLanguageItem("txt_product_by_category_text", "")}
					</p>
				</div>

				<div className="space-y-16">
					{visiblePairs.map((pair, pairIndex) => {
						// Lọc chỉ các category có sản phẩm
						const validCategories = pair.categories.filter(
							(category) => pair.products[category.name]?.products?.length > 0
						);

						if (validCategories.length === 0) return null;

						const currentCategory = pair.categories.find(
							(c) => c.name === activeCategories[pairIndex]
						);
						const currentCategoryId = currentCategory?.id;

						return (
							<div key={pairIndex}>
								<div className="flex justify-center mb-8">
									<div className="bg-muted p-1 rounded-lg inline-flex gap-2">
										{validCategories.map((category) => (
											<Button
												key={category.id}
												variant={
													activeCategories[pairIndex] === category.name
														? "default"
														: "ghost"
												}
												onClick={() =>
													handleCategoryChange(pairIndex, category.name)
												}
												className="px-8 py-3 rounded-md transition-all duration-300 font-medium"
												disabled={loading || loadMoreLoading !== null}
											>
												{category.name} (
												{pair.products[category.name]?.total || 0})
											</Button>
										))}
									</div>
								</div>

								{activeCategories[pairIndex] &&
								pair.products[activeCategories[pairIndex]] ? (
									<>
										<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
											{/* Skeleton cards khi đang load more */}
											{loadMoreLoading === currentCategoryId && (
												<>
													{[1, 2, 3, 4].map((index) => (
														<div
															key={`loading-${index}`}
															className="opacity-50"
														>
															<ProductCardSkeleton />
														</div>
													))}
												</>
											)}

											{/* Danh sách sản phẩm */}
											{pair.products[activeCategories[pairIndex]].products.map(
												(product, index) => (
													<div
														key={product.id}
														className={cn(
															"transition-opacity duration-300",
															loadMoreLoading === currentCategoryId
																? "opacity-50"
																: "opacity-100"
														)}
													>
														{renderProductCard(product, index)}
													</div>
												)
											)}
										</div>

										{pair.products[activeCategories[pairIndex]].current_page <
											pair.products[activeCategories[pairIndex]].last_page && (
											<div className="text-center mt-8">
												<Button
													variant="outline"
													size="lg"
													className="px-8 py-3 bg-transparent min-w-48"
													onClick={() => handleLoadMore(currentCategoryId || 0)}
													disabled={
														loadMoreLoading === currentCategoryId || loading
													}
												>
													{loadMoreLoading === currentCategoryId ? (
														<div className="flex items-center gap-2">
															<div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
															<span>Đang tải...</span>
														</div>
													) : (
														`Xem Thêm ${activeCategories[pairIndex]}`
													)}
												</Button>
											</div>
										)}
									</>
								) : !loading ? (
									<p className="text-center">
										Không có sản phẩm nào để hiển thị.
									</p>
								) : null}
							</div>
						);
					})}
				</div>

				{loading && (
					<div className="text-center mt-12">
						<div className="flex items-center justify-center gap-2">
							<div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
							<p>Đang tải danh mục...</p>
						</div>
					</div>
				)}
			</div>

			{selectedProduct && (
				<QuickViewModal
					product={{
						...selectedProduct,
						badge: selectedProduct.badge as "New" | "Sale" | "Hot" | undefined,
						discount: selectedProduct.originalPrice
							? Math.round(
									((selectedProduct.originalPrice - selectedProduct.price) /
										selectedProduct.originalPrice) *
										100
							  )
							: undefined
					}}
					onClose={() => setSelectedProduct(null)}
					selectedLangId={selectedLangId}
				/>
			)}
		</section>
	);
}
