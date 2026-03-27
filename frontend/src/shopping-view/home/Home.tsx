import { useOutletContext } from "react-router-dom";
import { BannerSlider } from "@/components/banner-slider";
import { ProductList } from "@/components/product-list";
import { DualCategoryProducts } from "@/components/dual-category-products";
import { FeaturedBanner } from "@/components/featured-banner";
import { useLanguageItem } from "@/hooks/useLanguageItem";

interface LayoutContext {
	selectedLangId: number;
	setSelectedLangId: React.Dispatch<React.SetStateAction<number>>;
}

export default function Home() {
	const { selectedLangId } = useOutletContext<LayoutContext>();
	const { getLanguageItem, loading, error } = useLanguageItem(selectedLangId);

	// Hiển thị lỗi nếu có
	if (error) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center">
				<div className="text-center text-red-500">
					<p className="text-xl font-semibold">Đã xảy ra lỗi</p>
					<p className="text-gray-600 mt-2">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div>
			<BannerSlider className="mt-16" langId={selectedLangId} />

			{loading ? (
				<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<div className="text-center space-y-8">
						<div className="space-y-4">
							<div className="space-y-2">
								<div className="h-12 md:h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse mx-auto max-w-2xl" />
								<div className="h-12 md:h-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse mx-auto max-w-2xl" />
							</div>
							<div className="space-y-2 max-w-2xl mx-auto">
								<div className="h-4 bg-gray-300 rounded animate-pulse w-full" />
								<div className="h-4 bg-gray-300 rounded animate-pulse w-5/6 mx-auto" />
								<div className="h-4 bg-gray-300 rounded animate-pulse w-4/6 mx-auto" />
							</div>
						</div>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<div className="w-40 h-12 bg-gray-300 rounded-lg animate-pulse" />
							<div className="w-48 h-12 bg-gray-300 rounded-lg animate-pulse" />
						</div>
					</div>
				</div>
			) : (
				<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<div className="text-center space-y-8">
						<div className="space-y-4">
							<h1 className="text-4xl md:text-6xl font-bold text-balance">
								{getLanguageItem("shopping_experience", "")}
								<br />
								<span className="text-primary">
									{getLanguageItem("best_experience", "")}
								</span>
							</h1>
							<p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
								{getLanguageItem("home_description", "")}
							</p>
						</div>

						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
								{getLanguageItem("btn__explore_now", "Khám phá ngay")}
							</button>
							<button className="px-8 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
								{getLanguageItem("btn_watch_categrory", "Xem danh mục")}
							</button>
						</div>
					</div>
				</div>
			)}

			<ProductList />
			<DualCategoryProducts />
			<FeaturedBanner />
		</div>
	);
}
