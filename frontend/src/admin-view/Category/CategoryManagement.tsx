import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { CategoryTable } from "./components/CategoryTable";
import { CategoryFormDialog } from "./components/CategoryFormDialog";
import api from "@/services/api";

export interface Category {
	id: number;
	lang_id: number;
	name: string;
	image?: string | File | null;
	attribute?: string;
	order: number;
	createdate: string;
	status: string;
	children?: Category[];
	language?: { id: number; name: string };
}

interface Language {
	id: number;
	name: string;
	image?: string;
	desc?: string;
	order: number;
	status: string;
}

interface LayoutContext {
	selectedLangId: number;
	languages: Language[];
}

const CategoryManagement = () => {
	const { selectedLangId, languages } = useOutletContext<LayoutContext>();

	const [allCategories, setAllCategories] = useState<Category[]>([]);
	const [displayedCategories, setDisplayedCategories] = useState<Category[]>(
		[]
	);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(false);

	const [showDialog, setShowDialog] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [allAttributes, setAllAttributes] = useState<any[]>([]);

	const [formData, setFormData] = useState<Partial<Category>>({
		id: 0,
		lang_id: selectedLangId,
		name: "",
		image: null,
		attribute: "",
		order: 0,
		status: "active"
	});

	const fetchCategories = async (langId: number) => {
		setLoading(true);
		try {
			const res = await api.get("/categories", {
				params: {
					lang_id: langId,
					search: search
				}
			});
			const parsedCategories = res.data.data.map((cat: Category) => ({
				...cat,
				attribute: cat.attribute || ""
			}));
			setAllCategories(parsedCategories || []);
			setDisplayedCategories(parsedCategories || []);
		} catch {
			toast.error("Không lấy được danh sách danh mục");
		} finally {
			setLoading(false);
		}
	};

	const fetchAttributes = async (langId: number) => {
		try {
			const res = await api.get(`/attributes/?lang_id=${langId}`);
			const attributes = Array.isArray(res.data.data)
				? res.data.data
				: res.data.data?.data || [];
			setAllAttributes(attributes);
		} catch (err) {
			console.error("Lỗi fetch attributes:", err);
			toast.error("Không lấy được danh sách thuộc tính");
			setAllAttributes([]);
		}
	};

	useEffect(() => {
		if (languages.length > 0) {
			fetchCategories(selectedLangId);
			fetchAttributes(selectedLangId);
		}
	}, [selectedLangId, languages.length]);

	useEffect(() => {
		if (!search) {
			setDisplayedCategories(allCategories);
			return;
		}
		const filterTree = (nodes: Category[]): Category[] => {
			return nodes.reduce((acc: Category[], node: Category) => {
				const children = filterTree(node.children || []);
				if (
					node.name.toLowerCase().includes(search.toLowerCase()) ||
					children.length > 0
				) {
					acc.push({ ...node, children });
				}
				return acc;
			}, []);
		};
		setDisplayedCategories(filterTree(allCategories));
	}, [search, allCategories]);

	const openAddDialog = () => {
		setIsEditing(false);
		setFormData({
			id: 0,
			lang_id: selectedLangId,
			name: "",
			image: null,
			attribute: "",
			order: 0,
			status: "active"
		});
		setShowDialog(true);
	};

	const openEditDialog = async (category: Category) => {
		try {
			const res = await api.get(`/categories/${category.id}`);
			const fullData = res.data.data;
			setFormData({
				...fullData,
				lang_id: selectedLangId
			});
		} catch {
			setFormData({
				...category,
				lang_id: selectedLangId
			});
		}
		setIsEditing(true);
		setShowDialog(true);
	};

	const handleSave = async (formDataToSend: FormData) => {
		try {
			if (isEditing && formData.id) {
				formDataToSend.append("_method", "PUT");
				await api.post(`/categories/${formData.id}`, formDataToSend, {
					headers: { "Content-Type": "multipart/form-data" }
				});
				toast.success("Cập nhật danh mục thành công");
			} else {
				await api.post("/categories", formDataToSend, {
					headers: { "Content-Type": "multipart/form-data" }
				});
				toast.success("Tạo danh mục thành công");
			}

			setShowDialog(false);
			fetchCategories(selectedLangId);
		} catch (err: any) {
			toast.error(err.response?.data?.message || "Lỗi khi lưu danh mục");
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Bạn có chắc muốn xóa danh mục này?")) return;
		try {
			await api.delete(`/categories/${id}`);
			toast.success("Xóa thành công");
			fetchCategories(selectedLangId);
		} catch {
			toast.error("Xóa thất bại");
		}
	};

	const handleDeleteMultiple = async () => {
		if (selectedIds.length === 0) {
			toast.error("Chưa chọn danh mục để xóa");
			return;
		}
		if (!confirm("Bạn có chắc muốn xóa nhiều danh mục?")) return;
		try {
			await api.post("/categories/delete-multiple", { ids: selectedIds });
			toast.success("Xóa nhiều thành công");
			setSelectedIds([]);
			fetchCategories(selectedLangId);
		} catch {
			toast.error("Xóa nhiều thất bại");
		}
	};

	const flatten = (nodes: Category[]): Category[] => {
		let flat: Category[] = [];
		nodes.forEach((n) => {
			flat.push(n);
			if (n.children) flat = flat.concat(flatten(n.children));
		});
		return flat;
	};

	const getDescendants = (id: number): number[] => {
		let desc: number[] = [];
		const collectDesc = (children: Category[] | undefined) => {
			children?.forEach((c) => {
				desc.push(c.id);
				collectDesc(c.children);
			});
		};
		const findNode = (nodes: Category[]) => {
			for (let node of nodes) {
				if (node.id === id) {
					collectDesc(node.children);
					return true;
				}
				if (findNode(node.children || [])) return true;
			}
			return false;
		};
		findNode(allCategories);
		return desc;
	};

	const getPossibleParents = (id: number | undefined): Category[] => {
		const flat = flatten(allCategories);
		if (!id) return flat;
		const descendants = getDescendants(id);
		return flat.filter((a) => a.id !== id && !descendants.includes(a.id));
	};

	return (
		<div className="p-6 space-y-6">
			<Card>
				<CardHeader>
					<div className="flex flex-col sm:flex-row justify-between gap-4">
						<div className="flex items-center gap-3">
							<CardTitle>Quản lý Danh mục</CardTitle>
							{loading && <Loader2 className="w-5 h-5 animate-spin" />}
						</div>

						<div className="flex flex-col sm:flex-row gap-3">
							<Input
								placeholder="Tìm kiếm..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="w-full sm:w-64"
							/>

							<div className="flex gap-2">
								<Button onClick={openAddDialog}>+ Thêm mới</Button>
								<Button
									variant="destructive"
									onClick={handleDeleteMultiple}
									disabled={selectedIds.length === 0}
								>
									Xóa nhiều ({selectedIds.length})
								</Button>
							</div>
						</div>
					</div>
				</CardHeader>

				<CardContent>
					<CategoryTable
						categories={displayedCategories}
						selectedIds={selectedIds}
						setSelectedIds={setSelectedIds}
						allAttributes={allAttributes}
						onEdit={openEditDialog}
						onDelete={handleDelete}
					/>
				</CardContent>
			</Card>

			<CategoryFormDialog
				open={showDialog}
				onOpenChange={setShowDialog}
				formData={formData}
				setFormData={setFormData}
				isEditing={isEditing}
				selectedLangId={selectedLangId}
				languages={languages}
				allAttributes={allAttributes}
				getPossibleParents={getPossibleParents}
				onSubmit={handleSave}
			/>
		</div>
	);
};

export default CategoryManagement;
