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
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Globe, Type, Hash, ImageIcon, Upload, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { Category } from "../CategoryManagement";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	formData: Partial<Category>;
	setFormData: (data: Partial<Category>) => void;
	isEditing: boolean;
	selectedLangId: number;
	languages: { id: number; name: string }[];
	allAttributes: any[];
	getPossibleParents: (id: number | undefined) => Category[];
	onSubmit: (formData: FormData) => Promise<void>;
}

export const CategoryFormDialog = ({
	open,
	onOpenChange,
	formData,
	setFormData,
	isEditing,
	selectedLangId,
	languages,
	allAttributes,
	getPossibleParents,
	onSubmit
}: Props) => {
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [showAttributeDialog, setShowAttributeDialog] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const selectedLanguage = languages.find((l) => l.id === selectedLangId);

	useEffect(() => {
		if (open) {
			setImageFile(null);
			setImagePreview("");
		}

		if (open && formData.image && typeof formData.image === "string") {
			setImagePreview(`http://localhost:8000${formData.image}`);
		}
	}, [open, formData.image]);

	const handleOpenFilePicker = () => {
		fileInputRef.current?.click();
	};

	const validateFile = (file: File): boolean => {
		const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
		const maxSize = 2 * 1024 * 1024;
		if (!allowedTypes.includes(file.type)) {
			toast.error("Chỉ hỗ trợ định dạng JPEG, PNG, JPG, GIF");
			return false;
		}
		if (file.size > maxSize) {
			toast.error("Kích thước file không được vượt quá 2MB");
			return false;
		}
		return true;
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (validateFile(file)) {
			setImageFile(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleRemoveImage = () => {
		setImageFile(null);
		setImagePreview("");
		setFormData({ ...formData, image: null });
	};

	const getSelectedAttributeIds = () => {
		return formData.attribute
			? formData.attribute
					.split(",")
					.map((id) => Number(id.trim()))
					.filter((id) => id > 0)
			: [];
	};

	const handleParentAttributeSelect = (attrId: number, checked: boolean) => {
		const selectedIds = getSelectedAttributeIds();
		if (checked) {
			if (!selectedIds.includes(attrId)) selectedIds.push(attrId);
		} else {
			const index = selectedIds.indexOf(attrId);
			if (index > -1) selectedIds.splice(index, 1);
		}
		setFormData({ ...formData, attribute: selectedIds.join(",") });
	};

	const handleSubmit = async () => {
		if (!formData.name?.trim()) {
			toast.error("Tên danh mục là bắt buộc");
			return;
		}

		setLoading(true);
		try {
			const fd = new FormData();

			fd.append("lang_id", selectedLangId.toString());
			fd.append("name", formData.name || "");
			fd.append("attribute", formData.attribute || "");
			fd.append("order", (formData.order || 0).toString());
			fd.append("status", formData.status || "active");

			if (imageFile) {
				fd.append("image", imageFile);
			}

			fd.append(
				"image_url",
				typeof formData.image === "string" ? formData.image : ""
			);

			await onSubmit(fd);
			toast.success(
				isEditing ? "Cập nhật danh mục thành công" : "Tạo danh mục thành công"
			);
			onOpenChange(false);
		} catch (err: any) {
			console.error(err);
			toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
		} finally {
			setLoading(false);
		}
	};

	const displayImage = imagePreview || (formData.image && typeof formData.image === "string" ? `http://localhost:8000${formData.image}` : "");

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="min-w-3xl max-h-[95vh] overflow-y-auto p-0">
					<DialogHeader className="px-6 pt-6 pb-4 border-b">
						<div className="flex items-center gap-3">
							<div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
								<Type className="h-6 w-6 text-primary" />
							</div>
							<div>
								<DialogTitle className="text-2xl font-bold">
									{isEditing ? "Chỉnh sửa Danh mục" : "Tạo Danh mục Mới"}
								</DialogTitle>
								<p className="text-sm text-muted-foreground mt-1">
									Quản lý danh mục sản phẩm
								</p>
							</div>
						</div>
					</DialogHeader>

					<div className="p-6 space-y-8">
						<div className="space-y-5">
							<h3 className="text-lg font-semibold flex items-center gap-2">
								<Type className="h-5 w-5" />
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
									Tên danh mục <span className="text-destructive">*</span>
								</Label>
								<Input
									placeholder="Nhập tên danh mục..."
									value={formData.name || ""}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									className="h-11 text-lg font-medium"
								/>
							</div>
						</div>

						{/* === THUỘC TÍNH === */}
						<div className="space-y-4">
							<h3 className="text-lg font-semibold flex items-center gap-2">
								<ChevronDown className="h-5 w-5" />
								Thuộc tính
							</h3>

							<div className="space-y-2">
								{getSelectedAttributeIds().length > 0 && (
									<div className="flex flex-wrap gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
										{getSelectedAttributeIds().map((attrId) => {
											const attr = allAttributes.find((a) => a.id === attrId);
											return attr ? (
												<Badge
													key={attrId}
													variant="secondary"
													className="px-3 py-1 text-xs cursor-pointer hover:bg-red-100 flex items-center gap-1"
													onClick={() => {
														const selectedIds = getSelectedAttributeIds().filter(
															(id) => id !== attrId
														);
														setFormData({
															...formData,
															attribute: selectedIds.join(",")
														});
													}}
												>
													{attr.name}
													<Button
														variant="ghost"
														size="sm"
														className="h-4 w-4 p-0 ml-1"
													>
														×
													</Button>
												</Badge>
											) : null;
										})}
									</div>
								)}

								<Button
									type="button"
									variant="outline"
									className="w-full justify-between h-auto py-8"
									onClick={() => setShowAttributeDialog(true)}
								>
									<span className="text-sm">
										{getSelectedAttributeIds().length > 0
											? `${getSelectedAttributeIds().length} thuộc tính đã chọn`
											: "Click để chọn thuộc tính cha..."}
									</span>
									<ChevronDown className="w-4 h-4" />
								</Button>
							</div>
						</div>

						{/* === HÌNH ẢNH === */}
						<div className="space-y-4">
							<h3 className="text-lg font-semibold flex items-center gap-2">
								<ImageIcon className="h-5 w-5" />
								Hình ảnh Danh mục
							</h3>

							{displayImage ? (
								<div className="relative rounded-lg overflow-hidden border-2 border-dashed border-muted group">
									<img
										src={displayImage}
										alt="Preview"
										className="w-full h-64 object-cover"
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
									className="relative w-full h-48 border-2 border-dashed hover:border-primary/50"
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
												JPG, PNG, GIF • Tối đa 2MB
											</p>
										</div>
									</div>
								</Button>
							)}

							<input
								ref={fileInputRef}
								type="file"
								accept="image/jpeg,image/png,image/jpg,image/gif"
								className="hidden"
								onChange={handleFileSelect}
							/>
						</div>

						{/* === TRẠNG THÁI === */}
						<div className="space-y-5">
							<h3 className="text-lg font-semibold">Trạng thái</h3>
							<div className="space-y-2">
								<Label>Trạng thái</Label>
								<Select
									value={formData.status || "active"}
									onValueChange={(v) => setFormData({ ...formData, status: v })}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="active">Hoạt động</SelectItem>
										<SelectItem value="inactive">Ẩn</SelectItem>
									</SelectContent>
								</Select>
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
								disabled={loading || !formData.name?.trim()}
							>
								{loading ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo Danh mục"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Attribute Selection Dialog */}
			<Dialog open={showAttributeDialog} onOpenChange={setShowAttributeDialog}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>
							Chọn Thuộc tính Cha ({getSelectedAttributeIds().length} đã chọn)
						</DialogTitle>
					</DialogHeader>
					<div className="max-h-96 overflow-y-auto">
						<div className="space-y-2">
							{allAttributes
								.filter((a) => a.status === "active" && a.parentid === null)
								.map((attr) => (
									<label
										key={attr.id}
										className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border"
									>
										<Checkbox
											checked={getSelectedAttributeIds().includes(attr.id)}
											onCheckedChange={(checked) =>
												handleParentAttributeSelect(attr.id, checked as boolean)
											}
										/>
										<div className="flex-1">
											<span className="font-medium">{attr.name}</span>
											<span className="text-xs text-gray-500 ml-2">
												({attr.type})
											</span>
										</div>
									</label>
								))}
						</div>
					</div>
					<div className="flex gap-2 pt-4">
						<Button
							variant="outline"
							onClick={() => setShowAttributeDialog(false)}
							className="flex-1"
						>
							Hủy
						</Button>
						<Button
							onClick={() => setShowAttributeDialog(false)}
							className="flex-1"
						>
							Xong ({getSelectedAttributeIds().length})
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};