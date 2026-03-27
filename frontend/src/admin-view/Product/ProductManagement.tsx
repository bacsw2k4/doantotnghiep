// src/pages/products/ProductManagement.tsx
"use client";

import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/services/api";
import { Loader2, Search, Plus, Trash2, Filter } from "lucide-react";
import { ProductTable } from "./components/ProductTable";
import { DataTablePagination } from "@/components/dataTablePagination";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProducts, type Product } from "@/hooks/useProducts";

interface Category {
	id: number;
	name: string;
	lang_id: number;
}

interface Attribute {
	id: number;
	name: string;
	parentid?: number | null;
	parentName?: string | null;
}

interface Language {
	id: number;
	name: string;
}

interface LayoutContext {
	selectedLangId: number;
	languages: Language[];
}

const ProductManagement = () => {
	const { selectedLangId } = useOutletContext<LayoutContext>();
	const navigate = useNavigate();

	const [search, setSearch] = useState("");
	const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [attributes, setAttributes] = useState<Attribute[]>([]);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [showFilterDialog, setShowFilterDialog] = useState(false);

	const { products, loading, pagination, goToPage, changePerPage, refresh } =
		useProducts({
			selectedLangId,
			search,
			categoryIds: selectedCategories
		});

	const fetchCategories = async () => {
		try {
			const res = await api.get(`/categories?lang_id=${selectedLangId}`);
			setCategories(res.data.data || []);
		} catch (err: any) {
			toast.error("Không lấy được danh sách danh mục");
		}
	};

	const fetchAttributes = async () => {
		try {
			const res = await api.get(`/attributes?lang_id=${selectedLangId}`);
			const nestedAttributes = res.data.data.data || [];
			const flatAttributes: Attribute[] = [];

			const flatten = (attrs: any[], parentName?: string) => {
				attrs.forEach((attr) => {
					if (attr.lang_id === selectedLangId) {
						flatAttributes.push({ ...attr, parentName: parentName || null });
					}
					if (attr.children && attr.children.length > 0) {
						flatten(attr.children, attr.name);
					}
				});
			};

			flatten(nestedAttributes);
			setAttributes(flatAttributes);
		} catch (err: any) {
			toast.error("Không lấy được danh sách thuộc tính");
		}
	};

	useEffect(() => {
		fetchCategories();
		fetchAttributes();
	}, [selectedLangId]);

	const openEditDialog = (product: Product) => {
		navigate(`/admin/products/edit/${product.id}`);
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
		try {
			await api.delete(`/products/${id}`);
			toast.success("Xóa thành công");
			refresh();
		} catch {
			toast.error("Xóa thất bại");
		}
	};

	const handleDeleteMultiple = async () => {
		if (selectedIds.length === 0) {
			toast.error("Chưa chọn sản phẩm nào");
			return;
		}
		if (!confirm(`Xóa ${selectedIds.length} sản phẩm đã chọn?`)) return;

		try {
			await api.post("/products/delete-multiple", { ids: selectedIds });
			toast.success("Xóa nhiều thành công");
			setSelectedIds([]);
			refresh();
		} catch {
			toast.error("Xóa nhiều thất bại");
		}
	};

	const clearFilters = () => {
		setSearch("");
		setSelectedCategories([]);
	};

	const toggleCategory = (categoryId: number) => {
		setSelectedCategories((prev) =>
			prev.includes(categoryId)
				? prev.filter((id) => id !== categoryId)
				: [...prev, categoryId]
		);
	};

	return (
		<div className="p-6 space-y-6">
			<Card>
				<CardHeader>
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
						<div className="flex items-center gap-3">
							<CardTitle className="text-2xl font-bold">
								Quản lý Sản phẩm
							</CardTitle>
							{loading && <Loader2 className="w-5 h-5 animate-spin" />}
						</div>

						<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
							{/* Search Input */}
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
								<Input
									placeholder="Tìm kiếm sản phẩm..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									onKeyDown={(e) =>
										e.key === "Enter" && setSearch(e.currentTarget.value)
									}
									className="pl-9 w-full sm:w-64"
								/>
							</div>

							{/* Filter Dialog */}
							<Dialog
								open={showFilterDialog}
								onOpenChange={setShowFilterDialog}
							>
								<DialogTrigger asChild>
									<Button variant="outline" className="flex items-center gap-2">
										<Filter className="h-4 w-4" />
										Lọc
										{(search || selectedCategories.length > 0) && (
											<Badge
												variant="destructive"
												className="ml-2 h-5 w-5 p-0 text-xs"
											>
												{(search ? 1 : 0) + selectedCategories.length}
											</Badge>
										)}
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-[500px]">
									<DialogHeader>
										<DialogTitle>Lọc sản phẩm</DialogTitle>
									</DialogHeader>
									<div className="space-y-4">
										<div>
											<label className="text-sm font-medium">Tìm kiếm</label>
											<Input
												placeholder="Nhập tên sản phẩm..."
												value={search}
												onChange={(e) => setSearch(e.target.value)}
												className="mt-1"
											/>
										</div>

										<div>
											<label className="text-sm font-medium">Danh mục</label>
											<ScrollArea className="h-40 border rounded-md p-2 mt-1">
												<div className="space-y-1">
													{categories.map((category) => (
														<div
															key={category.id}
															className="flex items-center space-x-2"
														>
															<input
																type="checkbox"
																id={`cat-${category.id}`}
																checked={selectedCategories.includes(
																	category.id
																)}
																onChange={() => toggleCategory(category.id)}
																className="h-4 w-4"
															/>
															<label
																htmlFor={`cat-${category.id}`}
																className="text-sm"
															>
																{category.name}
															</label>
														</div>
													))}
												</div>
											</ScrollArea>
										</div>

										<div className="flex justify-between">
											<Button variant="outline" onClick={clearFilters}>
												Xóa bộ lọc
											</Button>
											<Button
												onClick={() => {
													setShowFilterDialog(false);
												}}
											>
												Áp dụng
											</Button>
										</div>
									</div>
								</DialogContent>
							</Dialog>

							<div className="flex gap-2">
								<Button
									onClick={() => navigate("/admin/products/create")}
									className="flex items-center gap-2"
								>
									<Plus className="h-4 w-4" />
									Thêm mới
								</Button>
								<Button
									variant="destructive"
									onClick={handleDeleteMultiple}
									disabled={selectedIds.length === 0}
									className="flex items-center gap-2"
								>
									<Trash2 className="h-4 w-4" />
									Xóa nhiều ({selectedIds.length})
								</Button>
							</div>
						</div>
					</div>
				</CardHeader>

				<CardContent className="space-y-4">
					<ProductTable
						products={products}
						selectedIds={selectedIds}
						setSelectedIds={setSelectedIds}
						onEdit={openEditDialog}
						onDelete={handleDelete}
						attributes={attributes}
					/>

					{pagination.canPaginate && (
						<DataTablePagination
							currentPage={pagination.currentPage}
							totalPages={pagination.lastPage}
							perPage={pagination.perPage}
							totalItems={pagination.total}
							onPageChange={goToPage}
							onPerPageChange={changePerPage}
						/>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default ProductManagement;
