"use client";

import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { BannerTable } from "./components/BannerTable";
import { BannerFormDialog } from "./components/BannerFormDialog";
import api from "@/services/api";

export interface Banner {
	id: number;
	lang_id: number;
	title: string;
	subtitle: string;
	description: string;
	image: string | null;
	cta_text: string;
	cta_link: string;
	badge: string | null;
	theme: "light" | "dark";
	order: number;
	status: string;
	createdate: string;
	updatedate: string | null;
}

interface Language {
	id: number;
	name: string;
}

interface LayoutContext {
	selectedLangId: number;
	languages: Language[];
}

const BannerManagement = () => {
	const { selectedLangId, languages } = useOutletContext<LayoutContext>();

	const [banners, setBanners] = useState<Banner[]>([]);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(false);

	const [showDialog, setShowDialog] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);

	const [formData, setFormData] = useState<Partial<Banner>>({
		id: 0,
		lang_id: selectedLangId,
		title: "",
		subtitle: "",
		description: "",
		image: "",
		cta_text: "",
		cta_link: "",
		badge: "",
		theme: "light",
		order: 0,
		status: "active"
	});

	const fetchBanners = async (langId: number) => {
		setLoading(true);
		try {
			const res = await api.get("/banners", { params: { lang_id: langId } });
			setBanners(res.data.data || []);
		} catch {
			toast.error("Không lấy được danh sách banners");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (languages.length > 0) {
			fetchBanners(selectedLangId);
		}
	}, [selectedLangId, languages.length]);

	const filteredBanners = search
		? banners.filter((b) =>
				b.title.toLowerCase().includes(search.toLowerCase())
		  )
		: banners;

	const openAddDialog = () => {
		setIsEditing(false);
		setFormData({
			id: 0,
			lang_id: selectedLangId,
			title: "",
			subtitle: "",
			description: "",
			image: "",
			cta_text: "",
			cta_link: "",
			badge: "",
			theme: "light",
			order: 0,
			status: "active"
		});
		setImageFile(null);
		setImagePreview(null);
		setShowDialog(true);
	};

	const openEditDialog = (banner: Banner) => {
		setIsEditing(true);
		setFormData({ ...banner });
		setImagePreview(
			banner.image ? `http://localhost:8000${banner.image}` : null
		);
		setImageFile(null);
		setShowDialog(true);
	};

	const handleSave = async (formDataFromDialog: FormData) => {
		try {
			if (isEditing && formData.id) {
				formDataFromDialog.append("_method", "PUT");
				await api.post(`/banners/${formData.id}`, formDataFromDialog, {
					headers: { "Content-Type": "multipart/form-data" }
				});
				toast.success("Cập nhật banner thành công");
			} else {
				await api.post("/banners", formDataFromDialog, {
					headers: { "Content-Type": "multipart/form-data" }
				});
				toast.success("Tạo banner thành công");
			}

			setShowDialog(false);
			fetchBanners(selectedLangId);
		} catch (err: any) {
			toast.error(err.response?.data?.message || "Lỗi khi lưu banner");
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Bạn có chắc muốn xóa banner này?")) return;
		try {
			await api.delete(`/banners/${id}`);
			toast.success("Xóa thành công");
			fetchBanners(selectedLangId);
		} catch {
			toast.error("Xóa thất bại");
		}
	};

	const handleDeleteMultiple = async () => {
		if (selectedIds.length === 0) {
			toast.error("Chưa chọn banner nào");
			return;
		}
		if (!confirm(`Xóa ${selectedIds.length} banner đã chọn?`)) return;

		try {
			await api.post("/banners/delete-multiple", { ids: selectedIds });
			toast.success("Xóa nhiều thành công");
			setSelectedIds([]);
			fetchBanners(selectedLangId);
		} catch {
			toast.error("Xóa nhiều thất bại");
		}
	};

	return (
		<div className="p-6 space-y-6">
			<Card>
				<CardHeader>
					<div className="flex flex-col sm:flex-row justify-between gap-4">
						<div className="flex items-center gap-3">
							<CardTitle>Quản lý Banners</CardTitle>
							{loading && <Loader2 className="w-5 h-5 animate-spin" />}
						</div>

						<div className="flex flex-col sm:flex-row gap-3">
							<Input
								placeholder="Tìm kiếm banner..."
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
					<BannerTable
						banners={filteredBanners}
						selectedIds={selectedIds}
						setSelectedIds={setSelectedIds}
						onEdit={openEditDialog}
						onDelete={handleDelete}
					/>
				</CardContent>
			</Card>

			<BannerFormDialog
				open={showDialog}
				onOpenChange={setShowDialog}
				formData={formData}
				setFormData={setFormData}
				isEditing={isEditing}
				selectedLangId={selectedLangId}
				languages={languages}
				onSubmit={handleSave}
			/>
		</div>
	);
};

export default BannerManagement;
