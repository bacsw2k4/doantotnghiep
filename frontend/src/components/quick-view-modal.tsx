import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Minus, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";

interface AttributeOption {
	value: string;
	label: string;
	price: number;
	color?: string;
	image?: string;
}

interface AttributeGroup {
	parent_id: number | null;
	parent_name: string;
	type: string;
	options: AttributeOption[];
}

interface FullProduct {
	id: number;
	name: string;
	price: number;
	originalPrice?: number;
	rating: number;
	reviews: number;
	image: string;
	badge?: "New" | "Sale" | "Hot";
	discount?: number;
	attributes: AttributeGroup[];
}

interface QuickViewModalProps {
	product: {
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
	};
	onClose: () => void;
	selectedLangId: number;
}

const formatPrice = (price: number) => {
	return new Intl.NumberFormat("vi-VN", {
		style: "currency",
		currency: "VND"
	}).format(price);
};

const QuickViewModal: React.FC<QuickViewModalProps> = ({
	product,
	onClose,
	selectedLangId
}) => {
	const [quantity, setQuantity] = useState(1);
	const [selectedImage, setSelectedImage] = useState(0);
	const [fullProduct, setFullProduct] = useState<FullProduct | null>(null);
	const [selectedAttributes, setSelectedAttributes] = useState<{
		[parentId: number]: string;
	}>({});
	const [loading, setLoading] = useState(false);
	const { addToCart } = useCart();
  	const navigate = useNavigate();

	const images = [
		product.image,
		"/modern-smartphone.png",
		"/samsung-products.png",
		"/wireless-earbuds.png"
	];

	useEffect(() => {
		const fetchFullProduct = async () => {
			setLoading(true);
			try {
				const response = await axios.get(
					`http://localhost:8000/api/shopping/products/${product.url}`,
					{
						params: { lang_id: selectedLangId },
						headers: {
							Authorization: `Bearer ${localStorage.getItem("token")}`
						}
					}
				);

				let attributesArray: AttributeGroup[] = [];
				if (
					typeof response.data.attributes === "object" &&
					response.data.attributes !== null
				) {
					attributesArray = Object.values(response.data.attributes);
				} else if (Array.isArray(response.data.attributes)) {
					attributesArray = response.data.attributes;
				}

				const updatedProduct = {
					...response.data,
					attributes: attributesArray
				};
				setFullProduct(updatedProduct);

				// Set initial attribute selections
				const initialSelections: { [parentId: number]: string } = {};
				attributesArray.forEach((group: AttributeGroup) => {
					if (group.options?.length > 0) {
						initialSelections[group.parent_id || 0] = group.options[0].value;
					}
				});
				setSelectedAttributes(initialSelections);
			} catch (error: any) {
				toast.error(
					"Không thể tải chi tiết sản phẩm: " +
						(error.response?.data?.message || error.message)
				);
				setFullProduct({ ...product, attributes: [] });
			} finally {
				setLoading(false);
			}
		};
		fetchFullProduct();
	}, [product, selectedLangId]);

	const handleQuantityChange = (delta: number) => {
		setQuantity(Math.max(1, quantity + delta));
	};

	const handleAttributeChange = (parentId: number | null, value: string) => {
		setSelectedAttributes((prev) => ({ ...prev, [parentId || 0]: value }));
	};

	const handleAddToCart = async () => {
		const attributeIds = Object.values(selectedAttributes);
		const token = localStorage.getItem("token");

		if (!token) {
			toast.warn("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
			navigate("/login");
			return;
		}
		try {
			await addToCart(product.id, quantity, attributeIds, selectedLangId);
			onClose();
		} catch (error: any) {
			toast.error(
				"Không thể thêm vào giỏ hàng: " +
					(error.response?.data?.message || error.message)
			);
		}
	};

	if (loading) {
		return (
			<Dialog open={true} onOpenChange={onClose}>
				<DialogContent className="!w-[90vw] !max-w-[750px] !max-h-[90vh] overflow-y-auto">
					<div className="flex items-center justify-center h-64">
						<p>Đang tải chi tiết sản phẩm...</p>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={true} onOpenChange={onClose}>
			<DialogContent className="!w-[90vw] !max-w-[950px] !max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="sr-only">Xem nhanh sản phẩm</DialogTitle>
				</DialogHeader>

				<div className="grid md:grid-cols-2 gap-6 pt-4">
					{/* Images */}
					<div className="space-y-4">
						<div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
							<img
								src={images[selectedImage] || "/placeholder.svg"}
								alt={product.name}
								className="w-full h-full object-cover"
								loading="lazy"
							/>
							{product.badge && (
								<Badge
									className={`absolute top-4 left-4 ${
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
								<Badge className="absolute top-4 right-4 bg-red-500">
									-{product.discount}%
								</Badge>
							)}
						</div>
						<div className="grid grid-cols-4 gap-2">
							{images.map((image, index) => (
								<button
									key={index}
									onClick={() => setSelectedImage(index)}
									className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
										selectedImage === index
											? "border-primary ring-2 ring-primary/20"
											: "border-transparent hover:border-muted-foreground/20"
									}`}
								>
									<img
										src={image || "/placeholder.svg"}
										alt={`${product.name} ${index + 1}`}
										className="w-full h-full object-cover"
										loading="lazy"
									/>
								</button>
							))}
						</div>
					</div>

					{/* Product Info */}
					<div className="space-y-4">
						<div>
							<h2 className="text-2xl font-bold mb-2">{product.name}</h2>
							<div className="flex items-center gap-4 flex-wrap">
								<div className="flex items-center gap-1">
									{[...Array(5)].map((_, i) => (
										<Star
											key={i}
											className={`h-4 w-4 ${
												i < Math.floor(product.rating)
													? "fill-yellow-400 text-yellow-400"
													: "fill-muted text-muted"
											}`}
										/>
									))}
									<span className="text-sm font-medium ml-1">
										{product.rating}
									</span>
								</div>
								<span className="text-sm text-muted-foreground">
									({product.reviews.toLocaleString()} đánh giá)
								</span>
							</div>
						</div>
						<div className="flex items-baseline gap-3">
							<span className="text-3xl font-bold text-primary">
								{formatPrice(product.price)}
							</span>
							{product.originalPrice && (
								<span className="text-lg text-muted-foreground line-through">
									{formatPrice(product.originalPrice)}
								</span>
							)}
						</div>
						<p className="text-muted-foreground">
							Sản phẩm chính hãng, bảo hành 12 tháng toàn quốc. Miễn phí vận
							chuyển cho đơn hàng trên 500.000đ.
						</p>

						{/* Attributes Section */}
						{fullProduct?.attributes && fullProduct.attributes.length > 0 && (
							<div className="space-y-4">
								<h3 className="text-sm font-semibold">Tùy chọn:</h3>
								{fullProduct.attributes.map((group) => (
									<div key={group.parent_id || "other"} className="space-y-2">
										<label className="text-sm font-medium">
											{group.parent_name}
										</label>
										{group.type === "1" || group.type === "select" ? (
											<select
												value={selectedAttributes[group.parent_id || 0] || ""}
												onChange={(e) =>
													handleAttributeChange(group.parent_id, e.target.value)
												}
												className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
											>
												<option value="">Chọn {group.parent_name}</option>
												{group.options.map((option) => (
													<option key={option.value} value={option.value}>
														{option.label}{" "}
														{option.price > 0
															? `( + ${formatPrice(option.price)} )`
															: ""}
													</option>
												))}
											</select>
										) : group.type === "color" ? (
											<div className="flex gap-2">
												{group.options.map((option) => (
													<button
														key={option.value}
														onClick={() =>
															handleAttributeChange(
																group.parent_id,
																option.value
															)
														}
														className={cn(
															"w-10 h-10 rounded-full border-2 transition-all",
															selectedAttributes[group.parent_id || 0] ===
																option.value
																? "border-primary ring-2 ring-primary/20"
																: "border-transparent hover:border-gray-400"
														)}
														style={{ backgroundColor: option.color || "#fff" }}
														title={option.label}
													>
														{option.image && (
															<img
																src={option.image}
																alt={option.label}
																className="w-full h-full rounded-full object-cover"
															/>
														)}
													</button>
												))}
											</div>
										) : (
											<div className="flex flex-wrap gap-2">
												{group.options.map((option) => (
													<Button
														key={option.value}
														variant={
															selectedAttributes[group.parent_id || 0] ===
															option.value
																? "default"
																: "outline"
														}
														size="sm"
														onClick={() =>
															handleAttributeChange(
																group.parent_id,
																option.value
															)
														}
													>
														{option.label}{" "}
														{option.price > 0
															? `( + ${formatPrice(option.price)} )`
															: ""}
													</Button>
												))}
											</div>
										)}
									</div>
								))}
							</div>
						)}

						<div className="space-y-2">
							<label className="text-sm font-semibold">Số lượng:</label>
							<div className="flex items-center gap-4">
								<div className="flex items-center border-2 border-border rounded-lg">
									<Button
										size="icon"
										variant="ghost"
										onClick={() => handleQuantityChange(-1)}
										disabled={quantity <= 1}
									>
										<Minus className="h-4 w-4" />
									</Button>
									<span className="w-12 text-center font-semibold">
										{quantity}
									</span>
									<Button
										size="icon"
										variant="ghost"
										onClick={() => handleQuantityChange(1)}
									>
										<Plus className="h-4 w-4" />
									</Button>
								</div>
								<span className="text-sm text-muted-foreground">Còn hàng</span>
							</div>
						</div>
						<div className="space-y-3 pt-4 flex gap-3">
							<Button size="lg" className="w-full" onClick={handleAddToCart}>
								<ShoppingCart className="h-5 w-5 mr-2" />
								Thêm vào giỏ
							</Button>
							<Link to={`/product/${product.url}`}>
								<Button
									size="lg"
									variant="outline"
									className="w-full bg-transparent"
								>
									Xem chi tiết đầy đủ
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default QuickViewModal;
