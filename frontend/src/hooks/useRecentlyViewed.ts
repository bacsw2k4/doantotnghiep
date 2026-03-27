// src/hooks/useRecentlyViewed.ts
import { useState, useEffect, useCallback } from "react";
import api from "@/services/api";
import { toast } from "sonner";
import Cookies from "js-cookie";
import type { Category } from "./useProducts";

export interface Product {
	id: number;
	lang_id: number;
	name: string;
	desc?: string;
	image?: string;
	attribute?: string;
	price?: number;
	saleprice?: number;
	totalview: number;
	order: number;
	status: string;
	categories?: Category[];
	rating?: number;
	reviews?: number;
	badge?: "New" | "Sale" | "Hot";
	discount?: number;
	url: string
}

const RECENTLY_VIEWED_COOKIE = "recently_viewed";
const MAX_RECENT_ITEMS = 10;

interface UseRecentlyViewedParams {
	selectedLangId: number;
}

export const useRecentlyViewed = ({
	selectedLangId
}: UseRecentlyViewedParams) => {
	const [recentProducts, setRecentProducts] = useState<Product[]>([]);
	const [recentLoading, setRecentLoading] = useState(false);

	const fetchRecentProducts = useCallback(async () => {
		const cookieValue = Cookies.get(RECENTLY_VIEWED_COOKIE);
		if (!cookieValue) {
			setRecentProducts([]);
			return;
		}

		let ids: number[];
		try {
			ids = JSON.parse(cookieValue);
			if (!Array.isArray(ids) || ids.length === 0) {
				setRecentProducts([]);
				return;
			}
		} catch {
			setRecentProducts([]);
			return;
		}

		setRecentLoading(true);
		try {
			const res = await api.get("/products/recently-viewed", {
				params: {
					ids: ids.join(","),
					lang_id: selectedLangId
				}
			});

			const rawData = res.data?.data;

			let fetched: Product[] = [];

			if (rawData && typeof rawData === "object") {
				fetched = Object.values(rawData) as Product[];
			}

			// const sorted = ids
			// 	.map((id) => fetched.find((p) => p.id === id))
			// 	.filter(Boolean) as Product[];

			setRecentProducts(fetched);
		} catch (err: any) {
			toast.error("Không tải được sản phẩm đã xem");
			setRecentProducts([]);
		} finally {
			setRecentLoading(false);
		}
	}, [selectedLangId]);

	const addToRecentlyViewed = useCallback(
		(productId: string) => {
			if (!productId) return;

			const cookieValue = Cookies.get(RECENTLY_VIEWED_COOKIE);
			let ids: string[] = cookieValue ? JSON.parse(cookieValue) : [];

			ids = ids.filter((id) => id !== productId);
			ids.unshift(productId);
			ids = ids.slice(0, MAX_RECENT_ITEMS);

			Cookies.set(RECENTLY_VIEWED_COOKIE, JSON.stringify(ids), {
				expires: 30,
				path: "/",
				sameSite: "strict"
			});

			fetchRecentProducts();
		},
		[fetchRecentProducts]
	);

	const clearRecentViewed = useCallback(() => {
		Cookies.remove(RECENTLY_VIEWED_COOKIE);
		setRecentProducts([]);
	}, []);

	useEffect(() => {
		fetchRecentProducts();
	}, [fetchRecentProducts]);

	return {
		recentProducts,
		recentLoading,
		addToRecentlyViewed,
		refreshRecent: fetchRecentProducts,
		clearRecentViewed
	};
};
