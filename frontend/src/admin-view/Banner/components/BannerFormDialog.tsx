// src/pages/banners/components/BannerFormDialog.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from "@/components/ui/dialog";
import {
	Image as ImageIcon,
	Link2,
	Tag,
	Type,
	Hash,
	Globe,
	Upload,
	Trash2,
	Sparkles
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { Banner } from "../BannerManagement";
import { toast } from "sonner";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	formData: Partial<Banner>;
	setFormData: (data: Partial<Banner>) => void;
	isEditing: boolean;
	selectedLangId: number;
	languages: { id: number; name: string }[];
	onSubmit: (formData: FormData) => Promise<void>;
}

export const BannerFormDialog = ({
	open,
	onOpenChange,
	formData,
	setFormData,
	isEditing,
	selectedLangId,
	languages,
	onSubmit
}: Props) => {
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const selectedLanguage = languages.find((l) => l.id === selectedLangId);

	// Reset + load ảnh khi mở dialog
	useEffect(() => {
		if (open) {
			setImageFile(null);
			setImagePreview("");
		}

		if (open && formData.image) {
			setImagePreview(`http://localhost:8000${formData.image}`);
		}
	}, [open, formData.image]);

	const handleOpenFilePicker = () => {
		fileInputRef.current?.click();
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			toast.error("Vui lòng chọn file ảnh hợp lệ");
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			toast.error("Ảnh không được quá 10MB");
			return;
		}

		setImageFile(file);
		const reader = new FileReader();
		reader.onloadend = () => {
			setImagePreview(reader.result as string);
		};
		reader.readAsDataURL(file);

		// Reset input để có thể chọn lại cùng 1 file
		if (e.target) e.target.value = "";
	};

	const handleRemoveImage = () => {
		setImageFile(null);
		setImagePreview("");
		// Chỉ cần set image = "" → backend sẽ hiểu là muốn xóa
		setFormData({ ...formData, image: "" });
	};

	const handleSubmit = async () => {
		if (!formData.title?.trim()) {
			toast.error("Vui lòng nhập tiêu đề banner");
			return;
		}

		setLoading(true);
		try {
			const fd = new FormData();

			fd.append("lang_id", selectedLangId.toString());
			fd.append("title", formData.title || "");
			fd.append("subtitle", formData.subtitle || "");
			fd.append("description", formData.description || "");
			fd.append("cta_text", formData.cta_text || "");
			fd.append("cta_link", formData.cta_link || "");
			fd.append("badge", formData.badge || "");
			fd.append("theme", formData.theme || "light");
			fd.append("order", (formData.order || 0).toString());
			fd.append("status", formData.status || "active");

			// CÁCH MỚI - SIÊU ỔN ĐỊNH
			if (imageFile) {
				fd.append("image", imageFile);
			}

			// Luôn gửi image_url để backend biết ảnh hiện tại là gì
			fd.append("image_url", formData.image || "");

			await onSubmit(fd);
			toast.success(isEditing ? "Cập nhật banner thành công" : "Tạo banner thành công");
			onOpenChange(false);
		} catch (err: any) {
			console.error(err);
			toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
		} finally {
			setLoading(false);
		}
	};

	const displayImage = imagePreview || (formData.image ? `http://localhost:8000${formData.image}` : "");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="min-w-4xl max-h-[95vh] overflow-y-auto p-0">
				<DialogHeader className="px-6 pt-6 pb-4 border-b">
					<div className="flex items-center gap-3">
						<div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
							<Sparkles className="h-6 w-6 text-primary" />
						</div>
						<div>
							<DialogTitle className="text-2xl font-bold">
								{isEditing ? "Chỉnh sửa Banner" : "Tạo Banner Mới"}
							</DialogTitle>
							<p className="text-sm text-muted-foreground mt-1">
								Thiết kế banner nổi bật cho trang chủ
							</p>
						</div>
					</div>
				</DialogHeader>

				<div className="p-6 space-y-8">
					{/* === THÔNG TIN CƠ BẢN === */}
					<div className="space-y-5">
						<h3 className="text-lg font-semibold flex items-center gap-2">
							<Tag className="h-5 w-5" />
							Thông tin cơ bản
						</h3>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="flex items-center gap-2">
									<Globe className="h-4 w-4" />
									Ngôn ngữ
								</Label>
								<div className="h-10 flex items-center gap-2 px-3 border rounded-md bg-muted/30">
									<span className="font-medium">
										{selectedLanguage?.name || "Chọn ngôn ngữ"}
									</span>
								</div>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center gap-2">
									<Hash className="h-4 w-4" />
									Thứ tự hiển thị
								</Label>
								<Input
									type="number"
									min="0"
									value={formData.order || 0}
									onChange={(e) =>
										setFormData({ ...formData, order: Number(e.target.value) })
									}
									className="h-10"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Type className="h-4 w-4" />
								Tiêu đề <span className="text-destructive">*</span>
							</Label>
							<Input
								placeholder="Nhập tiêu đề banner..."
								value={formData.title || ""}
								onChange={(e) =>
									setFormData({ ...formData, title: e.target.value })
								}
								className="h-11 text-lg font-medium"
							/>
						</div>

						<div className="space-y-2">
							<Label>Phụ đề</Label>
							<Input
								placeholder="Phụ đề nhỏ bên dưới tiêu đề"
								value={formData.subtitle || ""}
								onChange={(e) =>
									setFormData({ ...formData, subtitle: e.target.value })
								}
							/>
						</div>

						<div className="space-y-2">
							<Label>Mô tả</Label>
							<Textarea
								placeholder="Mô tả chi tiết banner..."
								rows={3}
								value={formData.description || ""}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
							/>
						</div>
					</div>

					{/* === HÌNH ẢNH === */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold flex items-center gap-2">
							<ImageIcon className="h-5 w-5" />
							Hình ảnh Banner
						</h3>

						{displayImage ? (
							<div className="relative rounded-lg overflow-hidden border-2 border-dashed border-muted group">
								<img
									src={displayImage}
									alt="Preview"
									className="w-full h-96 object-cover"
								/>
								<div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
									<Button
										size="icon"
										variant="secondary"
										onClick={handleOpenFilePicker}
									>
										<Upload className="h-4 w-4" />
									</Button>
									<Button
										size="icon"
										variant="destructive"
										onClick={handleRemoveImage}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</div>
						) : (
							<Button
								variant="outline"
								className="relative w-full h-64 border-2 border-dashed hover:border-primary/50"
								onClick={handleOpenFilePicker}
								type="button"
							>
								<div className="flex flex-col items-center gap-4">
									<div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
										<Upload className="h-8 w-8 text-primary" />
									</div>
									<div className="text-center">
										<p className="font-medium text-lg">
											Click để tải lên hình ảnh
										</p>
										<p className="text-sm text-muted-foreground mt-1">
											JPG, PNG, WebP • Tối đa 10MB
										</p>
									</div>
								</div>
							</Button>
						)}

						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={handleFileSelect}
						/>
					</div>

					{/* === CTA & BADGE === */}
					<div className="space-y-5">
						<h3 className="text-lg font-semibold flex items-center gap-2">
							<Link2 className="h-5 w-5" />
							Call to Action & Badge
						</h3>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>CTA Text</Label>
								<Input
									placeholder="Mua ngay, Xem thêm..."
									value={formData.cta_text || ""}
									onChange={(e) =>
										setFormData({ ...formData, cta_text: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>CTA Link</Label>
								<Input
									placeholder="https://..."
									value={formData.cta_link || ""}
									onChange={(e) =>
										setFormData({ ...formData, cta_link: e.target.value })
									}
								/>
							</div>
						</div>

						<div className="grid grid-cols-3 gap-6">
							<div className="space-y-2">
								<Label>Badge</Label>
								<Input
									placeholder="Hot, New, -50%..."
									value={formData.badge || ""}
									onChange={(e) =>
										setFormData({ ...formData, badge: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Chủ đề</Label>
								<Select
									value={formData.theme || "light"}
									onValueChange={(v) =>
										setFormData({ ...formData, theme: v as "light" | "dark" })
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="light">Sáng (Light)</SelectItem>
										<SelectItem value="dark">Tối (Dark)</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Trạng thái</Label>
								<Select
									value={formData.status || "active"}
									onValueChange={(v) => setFormData({ ...formData, status: v })}
								>
									<SelectTrigger className="w-full">
										<SelectValue/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="active">Hoạt động</SelectItem>
										<SelectItem value="inactive">Ẩn</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
				</div>

				{/* === FOOTER === */}
				<div className="flex justify-between items-center border-t px-6 py-4 bg-muted/30">
					<p className="text-sm text-muted-foreground">
						<span className="text-destructive">*</span> Trường bắt buộc
					</p>
					<div className="flex gap-3">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={loading}
						>
							Hủy
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={loading || !formData.title?.trim()}
						>
							{loading ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo Banner"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};