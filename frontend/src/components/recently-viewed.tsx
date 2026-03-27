import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Heart } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

const formatPrice = (price: number | undefined) => {
	if (!price) return "Liên hệ";
	return new Intl.NumberFormat("vi-VN", {
		style: "currency",
		currency: "VND"
	}).format(price);
};

export function RecentlyViewed() {
	const { selectedLangId } = useOutletContext<{ selectedLangId: number }>();

	const { recentProducts, recentLoading, refreshRecent } = useRecentlyViewed({
		selectedLangId
	});

	useEffect(() => {
		refreshRecent();
	}, [refreshRecent, selectedLangId]);

	if (recentLoading) {
		return (
			<section className="py-12 border-t mt-12">
				<div className="mb-8">
					<h2 className="text-2xl font-bold mb-2">Sản phẩm đã xem gần đây</h2>
					<p className="text-muted-foreground">Đang tải...</p>
				</div>
			</section>
		);
	}

	if (recentProducts.length === 0) {
		return (
			<section className="py-12 border-t mt-12">
				<div className="mb-8">
					<h2 className="text-2xl font-bold mb-2">Sản phẩm đã xem gần đây</h2>
					<p className="text-muted-foreground">
						Chưa có sản phẩm nào được xem gần đây.
					</p>
				</div>
			</section>
		);
	}

	return (
		<section className="py-12 border-t mt-12">
			<div className="mb-8">
				<h2 className="text-2xl font-bold mb-2">Sản phẩm đã xem gần đây</h2>
				<p className="text-muted-foreground">
					Các sản phẩm bạn đã xem trong thời gian gần đây
				</p>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
				{recentProducts.map((product) => (
					<Link key={product.id} to={`/product/${product.url}`}>
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
								</div>
								<div className="p-3">
									<h3 className="font-semibold text-sm mb-2 group-hover:text-primary transition-colors line-clamp-2">
										{product.name}
									</h3>
									<div className="flex items-center gap-1 mb-2">
										{[...Array(5)].map((_, i) => (
											<Star
												key={i}
												className={`w-3 h-3 ${
													i < Math.floor(product.rating ?? 4)
														? "fill-yellow-400 text-yellow-400"
														: "text-gray-300"
												}`}
											/>
										))}
										<span className="text-xs text-muted-foreground ml-1">
											({product.reviews ?? 0})
										</span>
									</div>
									<div className="flex items-center justify-between">
										<div className="flex flex-col">
											<span className="text-sm font-bold text-primary">
												{formatPrice(product.price)}
											</span>
											{product.saleprice &&
												product.price !== undefined &&
												product.saleprice > product.price && (
													<span className="text-xs text-muted-foreground line-through">
														{formatPrice(product.saleprice)}
													</span>
												)}
										</div>
										<Button
											size="icon"
											variant="ghost"
											className="h-8 w-8 hover:text-red-500"
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												toast.info("Đã thêm vào yêu thích!");
											}}
										>
											<Heart className="w-4 h-4" />
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</section>
	);
}
