import { useState, useEffect } from "react";
import { useParams, useOutletContext, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
	Grid3X3,
	List,
	Star,
	ShoppingCart,
	Heart,
	SlidersHorizontal,
	X,
	Search
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useDebounce } from "use-debounce";
import QuickViewModal from "@/components/quick-view-modal";
import { RecentlyViewed } from "@/components/recently-viewed";

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
	badge?: "New" | "Sale" | "Hot";
	discount?: number;
	category: string;
	url: string;
}

interface Category {
	id: number;
	name: string;
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

export default function CategoryPage() {
	const { slug } = useParams<{ slug: string }>();
	const { selectedLangId } = useOutletContext<LayoutContext>();
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [sortBy, setSortBy] = useState<
		"popular" | "price-low" | "price-high" | "newest"
	>("popular");
	const [showFilters, setShowFilters] = useState(false);
	const [priceRange, setPriceRange] = useState([0, 50000000]);
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
	const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
		null
	);
	const [products, setProducts] = useState<Product[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [lastPage, setLastPage] = useState(1);
	const [totalProducts, setTotalProducts] = useState(0);
	const [loading, setLoading] = useState(false);
	const [categories, setCategories] = useState<string[]>([]);
	const [categoriesLoading, setCategoriesLoading] = useState(false);
	const { search } = useLocation();
	const queryParams = new URLSearchParams(search);
	const initialSearch = queryParams.get("q") || "";

	useEffect(() => {
		if (initialSearch) {
			setSearchTerm(initialSearch);
		}
	}, [initialSearch]);
	const perPage = 12;

	useEffect(() => {
		const fetchCategories = async () => {
			setCategoriesLoading(true);
			try {
				const response = await axios.get<{ data: Category[] }>(
					"http://localhost:8000/api/shopping/getCategory",
					{
						params: { lang_id: selectedLangId }
					}
				);
				const categoryNames = response.data.data.map((c) => c.name);
				setCategories(categoryNames);

				if (slug) {
					const decodedSlug = decodeURIComponent(slug);
					if (categoryNames.includes(decodedSlug)) {
						setSelectedCategories([decodedSlug]);
					} else {
						setSelectedCategories([]);
					}
				}
			} catch (error: any) {
				toast.error(
					"Không thể tải danh mục: " +
						(error.response?.data?.message || error.message)
				);
				setCategories([]);
			} finally {
				setCategoriesLoading(false);
			}
		};
		fetchCategories();
	}, [selectedLangId, slug]);

	const fetchProducts = async (page: number = 1) => {
		setLoading(true);
		try {
			const validCategories = selectedCategories.filter((cat) =>
				categories.includes(cat)
			);
			const params = {
				lang_id: selectedLangId,
				categories:
					validCategories.length > 0 ? validCategories.join(",") : undefined,
				search: debouncedSearchTerm || undefined,
				price_min: priceRange[0],
				price_max: priceRange[1],
				sort_by: sortBy,
				per_page: perPage,
				page
			};
			const response = await axios.get<ApiResponse>(
				"http://localhost:8000/api/shopping/products",
				{
					params,
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`
					}
				}
			);

			setProducts(response.data.data);
			setCurrentPage(response.data.current_page);
			setLastPage(response.data.last_page);
			setTotalProducts(response.data.total);
		} catch (error: any) {
			toast.error(
				"Không thể tải sản phẩm: " +
					(error.response?.data?.message || error.message)
			);
			setProducts([]);
		} finally {
			setLoading(false);
		}
	};

	const addToCart = async (productId: number, quantity: number = 1) => {
		try {
			const response = await axios.post(
				"http://localhost:8000/api/shopping/cart",
				{
					product_id: productId,
					quantity,
					lang_id: selectedLangId
				},
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`
					}
				}
			);
			toast.success("Đã thêm vào giỏ hàng!");
		} catch (error: any) {
			toast.error(
				"Không thể thêm vào giỏ hàng: " +
					(error.response?.data?.message || error.message)
			);
		}
	};

	useEffect(() => {
		setCurrentPage(1);
		fetchProducts(1);
	}, [
		selectedLangId,
		selectedCategories,
		priceRange,
		sortBy,
		debouncedSearchTerm
	]);

	const handleCategoryToggle = (category: string) => {
		setSelectedCategories((prev) => {
			const newCategories = prev.includes(category)
				? prev.filter((c) => c !== category)
				: [...prev, category];
			return newCategories;
		});
		setCurrentPage(1);
	};

	const clearFilters = () => {
		setSelectedCategories([]);
		setPriceRange([0, 50000000]);
		setSearchTerm("");
		setCurrentPage(1);
	};

	const activeFiltersCount =
		(selectedCategories.length > 0 ? 1 : 0) +
		(priceRange[0] > 0 || priceRange[1] < 50000000 ? 1 : 0) +
		(debouncedSearchTerm ? 1 : 0);

	const ProductCard = ({ product }: { product: Product }) => {
		if (viewMode === "list") {
			return (
				<Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
					<CardContent className="p-0">
						<div className="flex flex-col sm:flex-row">
							<div className="relative w-full sm:w-48 h-48 sm:h-32 overflow-hidden">
								<img
									src={product.image || "/placeholder.svg"}
									alt={product.name}
									className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
									<Link to={`/product/${product.id}`}>
										<h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors cursor-pointer">
											{product.name}
										</h3>
									</Link>
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
									<div className="flex gap-2">
										<Button
											size="sm"
											variant="outline"
											className="hover:text-red-500 bg-transparent"
											onClick={(e) => {
												e.preventDefault();
												toast.info(
													"Chức năng thêm vào danh sách yêu thích đang phát triển!"
												);
											}}
										>
											<Heart className="w-4 h-4" />
										</Button>
										<Button
											size="sm"
											onClick={() => setQuickViewProduct(product)}
										>
											Xem nhanh
										</Button>
										<Button
											size="sm"
											className="hover:bg-primary/90"
											onClick={(e) => {
												e.preventDefault();
												addToCart(product.id);
											}}
										>
											<ShoppingCart className="w-4 h-4 mr-2" />
											Thêm
										</Button>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			);
		}

		return (
			<Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
				<CardContent className="p-0">
					<div className="relative aspect-square overflow-hidden rounded-t-lg">
						<img
							src={product.image || "/placeholder.svg"}
							alt={product.name}
							className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
							<Button
								size="sm"
								className="bg-white text-black hover:bg-gray-100"
								onClick={() => setQuickViewProduct(product)}
							>
								Xem nhanh
							</Button>
						</div>
					</div>
					<div className="p-4">
						<Link to={`/product/${product.id}`}>
							<h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2 cursor-pointer">
								{product.name}
							</h3>
						</Link>
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
							<Button
								size="sm"
								variant="outline"
								className="hover:text-red-500 bg-transparent"
								onClick={(e) => {
									e.preventDefault();
									toast.info(
										"Chức năng thêm vào danh sách yêu thích đang phát triển!"
									);
								}}
							>
								<Heart className="w-4 h-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	};

	return (
		<div className="min-h-screen bg-background mt-[60px]">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="text-sm text-muted-foreground mb-6">
					<Link to="/" className="hover:text-primary">
						Trang chủ
					</Link>
					<span className="mx-2">/</span>
					<span className="text-foreground font-medium">
						{selectedCategories.length > 0
							? selectedCategories.join(", ")
							: "Tất cả sản phẩm"}
					</span>
				</div>
				<div className="mb-6 flex justify-between items-center">
					<h1 className="text-3xl font-bold">
						{selectedCategories.length > 0
							? selectedCategories.join(", ")
							: "Tất cả sản phẩm"}
					</h1>
					<p className="text-muted-foreground">
						Hiển thị {products.length} trong tổng số {totalProducts} sản phẩm
					</p>
				</div>

				<div className="flex flex-col lg:flex-row gap-8">
					<div
						className={`lg:w-64 ${showFilters ? "block" : "hidden lg:block"}`}
					>
						<div className="sticky top-4 space-y-6">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold">Bộ lọc</h2>
								{activeFiltersCount > 0 && (
									<Button variant="ghost" size="sm" onClick={clearFilters}>
										Xóa tất cả
									</Button>
								)}
							</div>
							<div className="space-y-3">
								<h3 className="font-medium">Tìm kiếm</h3>
								<div className="relative">
									<input
										type="text"
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										placeholder="Tìm kiếm sản phẩm..."
										className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
									/>
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
								</div>
							</div>
							<div className="space-y-3">
								<h3 className="font-medium">Khoảng giá</h3>
								<Slider
									min={0}
									max={50000000}
									step={1000000}
									value={priceRange}
									onValueChange={setPriceRange}
									className="py-4"
								/>
								<div className="flex items-center justify-between text-sm">
									<span>{formatPrice(priceRange[0])}</span>
									<span>{formatPrice(priceRange[1])}</span>
								</div>
							</div>
							<div className="space-y-3">
								<h3 className="font-medium">Danh mục</h3>
								{categoriesLoading ? (
									<div className="space-y-2">
										{[...Array(5)].map((_, i) => (
											<div
												key={i}
												className="animate-pulse bg-muted h-6 rounded"
											/>
										))}
									</div>
								) : categories.length > 0 ? (
									<div className="space-y-2">
										{categories.map((category) => (
											<label
												key={category}
												className="flex items-center gap-2 cursor-pointer"
											>
												<Checkbox
													checked={selectedCategories.includes(category)}
													onCheckedChange={() => handleCategoryToggle(category)}
												/>
												<span className="text-sm">{category}</span>
											</label>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">
										Không có danh mục nào.
									</p>
								)}
							</div>
						</div>
					</div>
					<div className="flex-1">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
							<Button
								variant="outline"
								className="lg:hidden bg-transparent"
								onClick={() => setShowFilters(!showFilters)}
							>
								<SlidersHorizontal className="w-4 h-4 mr-2" />
								Bộ lọc {activeFiltersCount > 0 && `(${activeFiltersCount})`}
							</Button>

							<div className="flex items-center gap-4 ml-auto">
								<select
									value={sortBy}
									onChange={(e) => setSortBy(e.target.value as any)}
									className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
								>
									<option value="popular">Phổ biến nhất</option>
									<option value="price-low">Giá thấp đến cao</option>
									<option value="price-high">Giá cao đến thấp</option>
									<option value="newest">Mới nhất</option>
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
						{activeFiltersCount > 0 && (
							<div className="flex flex-wrap gap-2 mb-6">
								{selectedCategories.map((category) => (
									<Badge key={category} variant="secondary" className="gap-1">
										{category}
										<button onClick={() => handleCategoryToggle(category)}>
											<X className="w-3 h-3" />
										</button>
									</Badge>
								))}
								{(priceRange[0] > 0 || priceRange[1] < 50000000) && (
									<Badge variant="secondary" className="gap-1">
										{formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
										<button onClick={() => setPriceRange([0, 50000000])}>
											<X className="w-3 h-3" />
										</button>
									</Badge>
								)}
								{debouncedSearchTerm && (
									<Badge variant="secondary" className="gap-1">
										Tìm kiếm: {debouncedSearchTerm}
										<button onClick={() => setSearchTerm("")}>
											<X className="w-3 h-3" />
										</button>
									</Badge>
								)}
							</div>
						)}
						{loading ? (
							<div
								className={`grid gap-6 ${
									viewMode === "grid"
										? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
										: "grid-cols-1"
								}`}
							>
								{[...Array(perPage)].map((_, i) => (
									<div
										key={i}
										className="animate-pulse bg-muted h-96 rounded-lg"
									/>
								))}
							</div>
						) : products.length > 0 ? (
							<div
								className={`grid gap-6 ${
									viewMode === "grid"
										? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
										: "grid-cols-1"
								}`}
							>
								{products.map((product) => (
									<ProductCard key={product.id} product={product} />
								))}
							</div>
						) : (
							<div className="text-center py-12">
								<p className="text-muted-foreground mb-4">
									Không tìm thấy sản phẩm phù hợp
								</p>
								<Button onClick={clearFilters}>Xóa bộ lọc</Button>
							</div>
						)}
						{products.length > 0 && (
							<div className="flex justify-center mt-12">
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => fetchProducts(currentPage - 1)}
										disabled={currentPage === 1 || loading}
									>
										Trước
									</Button>
									{[...Array(lastPage)].map((_, i) => (
										<Button
											key={i}
											variant={currentPage === i + 1 ? "default" : "outline"}
											size="sm"
											onClick={() => fetchProducts(i + 1)}
											disabled={loading}
										>
											{i + 1}
										</Button>
									))}
									<Button
										variant="outline"
										size="sm"
										onClick={() => fetchProducts(currentPage + 1)}
										disabled={currentPage === lastPage || loading}
									>
										Sau
									</Button>
								</div>
							</div>
						)}
					</div>
				</div>
				<RecentlyViewed />
			</div>
			{quickViewProduct && (
				<QuickViewModal
					product={quickViewProduct}
					onClose={() => setQuickViewProduct(null)}
					selectedLangId={selectedLangId}
				/>
			)}
		</div>
	);
}
