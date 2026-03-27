import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { toast } from "react-toastify";
import axios from "axios";

interface Product {
	id: number;
	name: string;
	price: number;
	originalPrice?: number;
	rating: number;
	reviews: number;
	image: string;
	hoverImage?: string;
	badge?: "New" | "Sale" | "Hot";
	discount?: number;
	category?: string;
	url: string;
}

interface RelatedProductsProps {
	selectedLangId: number;
	productId: number;
	limit?: number;
}

const formatPrice = (price: number) => {
	return new Intl.NumberFormat("vi-VN", {
		style: "currency",
		currency: "VND"
	}).format(price);
};

const RelatedProducts: React.FC<RelatedProductsProps> = ({
	selectedLangId,
	productId,
	limit = 8
}) => {
	const { addToCart } = useCart();
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

	useEffect(() => {
		const fetchRelatedProducts = async () => {
			try {
				setLoading(true);
				setError(null);

				const token = localStorage.getItem("token");

				const response = await axios.get(
					`http://localhost:8000/api/shopping/products/${productId}/related`,
					{
						params: {
							lang_id: selectedLangId,
							limit: limit
						},
						headers: {
							Authorization: token ? `Bearer ${token}` : "",
							"Accept-Language": selectedLangId.toString()
						}
					}
				);

				if (response.data && Array.isArray(response.data.data)) {
					setProducts(response.data.data);
				} else {
					setProducts([]);
				}
			} catch (err: any) {
				setError(
					err.response?.data?.message || "Không thể tải sản phẩm liên quan"
				);
				setProducts([]);
			} finally {
				setLoading(false);
			}
		};

		if (productId) {
			fetchRelatedProducts();
		}
	}, [productId, selectedLangId, limit]);

	const handleAddToCart = async (product: Product, e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const token = localStorage.getItem("token");

		if (!token) {
			toast.warn("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
			navigate("/login");
			return;
		}

		try {
			await addToCart(product.id, 1, [], selectedLangId);
			toast.success("Đã thêm vào giỏ hàng!");
		} catch (error: any) {
			toast.error(
				error.response?.data?.message ||
					error.message ||
					"Không thể thêm vào giỏ hàng"
			);
		}
	};

	if (loading) {
		return (
			<section className="py-12 border-t mt-12">
				<div className="mb-8">
					<h2 className="text-2xl font-bold mb-2">Sản phẩm liên quan</h2>
					<p className="text-muted-foreground">Đang tải sản phẩm...</p>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
					{[...Array(4)].map((_, i) => (
						<Card key={i} className="animate-pulse">
							<CardContent className="p-0">
								<div className="aspect-square bg-gray-200 rounded-t-lg"></div>
								<div className="p-4 space-y-3">
									<div className="h-4 bg-gray-200 rounded w-3/4"></div>
									<div className="h-4 bg-gray-200 rounded w-1/2"></div>
									<div className="h-4 bg-gray-200 rounded w-1/4"></div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</section>
		);
	}

	if (products.length === 0) {
		return null;
	}
	return (
		<section className="py-12 border-t mt-12">
			<div className="mb-8">
				<h2 className="text-2xl font-bold mb-2">Sản phẩm liên quan</h2>
				<p className="text-muted-foreground">
					Các sản phẩm tương tự bạn có thể thích
				</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{products.map((product) => (
					<Card
						key={product.id}
						className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
					>
						<CardContent className="p-0">
							<Link to={`/product/${product.url}`}>
								<div className="relative aspect-square overflow-hidden rounded-t-lg">
									<img
										src={product.image || "/placeholder.svg"}
										alt={product.name}
										className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
										loading="lazy"
									/>
									{product.hoverImage && (
										<img
											src={product.hoverImage}
											alt={product.name}
											className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
										/>
									)}
									{product.badge && (
										<Badge
											className={`absolute top-2 left-2 ${
												product.badge === "New"
													? "bg-green-500 hover:bg-green-600"
													: product.badge === "Sale"
													? "bg-red-500 hover:bg-red-600"
													: "bg-orange-500 hover:bg-orange-600"
											}`}
										>
											{product.badge}
										</Badge>
									)}
									{product.discount && (
										<Badge className="absolute top-2 right-2 bg-red-500 hover:bg-red-600">
											-{product.discount}%
										</Badge>
									)}
									<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
									<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
										<Button
											size="sm"
											className="bg-white text-black hover:bg-gray-100 shadow-md"
											onClick={(e) => handleAddToCart(product, e)}
										>
											<ShoppingCart className="w-4 h-4 mr-2" />
											Thêm vào giỏ
										</Button>
									</div>
								</div>
							</Link>
							<div className="p-4">
								<Link to={`/product/${product.url}`}>
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
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</section>
	);
};

export default RelatedProducts;
