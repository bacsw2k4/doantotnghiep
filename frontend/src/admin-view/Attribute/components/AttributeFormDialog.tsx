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
import { ColorPicker } from "@/components/ui/color-picker";
import {
	Globe,
	Image as ImageIcon,
	Layers,
	Tag,
	Type,
	Palette,
	Hash,
	Circle,
	CircleOff,
	Settings,
	Upload,
	Trash2,
	Plus,
	Minus
} from "lucide-react";
import type { Attribute } from "@/hooks/useAttributes";
import { useState, useEffect } from "react";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	formData: Partial<Attribute>;
	setFormData: (data: Partial<Attribute>) => void;
	isEditing: boolean;
	possibleParents: Attribute[];
	selectedLangId: number;
	languages: { id: number; name: string }[];
	onSubmit: (formData: FormData) => Promise<void>;
	onGetMaxOrder: (parentId: number | null, langId: number) => Promise<number>;
}

const ATTRIBUTE_TYPES = [
	{ value: "text", label: "Văn bản", icon: <Type className="h-4 w-4" /> },
	{ value: "color", label: "Màu sắc", icon: <Palette className="h-4 w-4" /> },
	{
		value: "image",
		label: "Hình ảnh",
		icon: <ImageIcon className="h-4 w-4" />
	},
	{
		value: "select",
		label: "dropdown",
		icon: <div className="h-4 w-4 border rounded" />
	}
];

export const AttributeFormDialog = ({
	open,
	onOpenChange,
	formData,
	setFormData,
	isEditing,
	possibleParents,
	selectedLangId,
	languages,
	onSubmit,
	onGetMaxOrder
}: Props) => {
	const selectedLanguage = languages.find((lang) => lang.id === selectedLangId);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string>("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (open && !isEditing) {
			fetchMaxOrder();
		}
	}, [open, isEditing]);

	useEffect(() => {
		if (!isEditing && open && formData.parentid !== undefined) {
			fetchMaxOrder();
		}
	}, [formData.parentid, open, isEditing]);

	const fetchMaxOrder = async () => {
		try {
			const maxOrder = await onGetMaxOrder(
				formData.parentid || null,
				selectedLangId
			);
			setFormData({ ...formData, order: maxOrder });
		} catch (error) {
			console.error("Failed to fetch max order:", error);
		}
	};

	const handleColorChange = (color: string) => {
		setFormData({ ...formData, color });
	};

	const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, color: e.target.value || undefined });
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			alert("Vui lòng chọn file hình ảnh");
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			alert("File không được vượt quá 5MB");
			return;
		}

		setSelectedFile(file);

		const reader = new FileReader();
		reader.onloadend = () => {
			setImagePreview(reader.result as string);
		};
		reader.readAsDataURL(file);
	};

	const handleRemoveImage = () => {
		setSelectedFile(null);
		setImagePreview("");
		setFormData({ ...formData, image: "" });
	};

	const handleOrderChange = (increment: number) => {
		const newOrder = Math.max(0, (formData.order || 0) + increment);
		setFormData({ ...formData, order: newOrder });
	};

	const handleSetMaxOrder = async () => {
		try {
			const maxOrder = await onGetMaxOrder(
				formData.parentid || null,
				selectedLangId
			);
			setFormData({ ...formData, order: maxOrder });
		} catch (error) {
			console.error("Failed to get max order:", error);
		}
	};

	const handleSubmit = async () => {
		if (!formData.name?.trim()) return;

		setLoading(true);
		try {
			const formDataObj = new FormData();

			formDataObj.append("name", formData.name);
			formDataObj.append("type", formData.type || "text");
			formDataObj.append("color", formData.color || "");
			formDataObj.append("order", (formData.order || 0).toString());
			formDataObj.append("status", formData.status || "active");
			formDataObj.append("lang_id", selectedLangId.toString());

			if (formData.parentid) {
				formDataObj.append("parentid", formData.parentid.toString());
			}

			if (selectedFile) {
				formDataObj.append("image", selectedFile);
			}

			formDataObj.append("image_url", formData.image || "");

			await onSubmit(formDataObj);
			onOpenChange(false);
			handleReset();
		} catch (error) {
			console.error("Submit error:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setFormData({
			name: "",
			parentid: null,
			type: "",
			color: "",
			image: "",
			order: 0,
			status: "active"
		});
		setSelectedFile(null);
		setImagePreview("");
	};

	const displayImage = imagePreview || formData.image;

	console.log(displayImage);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="min-w-[800px] max-w-[1000px] max-h-[95vh] overflow-y-auto p-0"
			>
				<DialogHeader className="px-6 pt-6 pb-4 border-b">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
								<Tag className="h-5 w-5 text-primary" />
							</div>
							<div>
								<DialogTitle className="text-xl font-bold">
									{isEditing ? "Chỉnh sửa thuộc tính" : "Tạo thuộc tính mới"}
								</DialogTitle>
							</div>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-6 p-6">
					<div className="space-y-4">
						<h3 className="text-lg font-semibold flex items-center gap-2">
							<Tag className="h-5 w-5" />
							Thông tin cơ bản
						</h3>

						<div className="space-y-2 w-full">
							<Label htmlFor="name" className="text-sm font-medium">
								Tên thuộc tính *
							</Label>
							<Input
								id="name"
								placeholder="Nhập tên thuộc tính"
								value={formData.name || ""}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								className="h-10"
								disabled={loading}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="text-sm font-medium flex items-center gap-2">
									<Layers className="h-4 w-4" />
									Thuộc tính cha
								</Label>
								<Select
									value={formData.parentid?.toString() || "none"}
									onValueChange={(v) =>
										setFormData({
											...formData,
											parentid: v === "none" ? null : Number(v)
										})
									}
									disabled={loading}
								>
									<SelectTrigger className="!h-10 flex-1 w-full">
										<SelectValue placeholder="Chọn thuộc tính cha" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">
											<span className="font-medium">Không có</span>
										</SelectItem>
										{possibleParents.map((p) => (
											<SelectItem key={p.id} value={p.id.toString()}>
												<div className="flex items-center gap-3">
													<div
														className="h-4 w-4 rounded border"
														style={{ backgroundColor: p.color || "#ccc" }}
													/>
													<span>{p.name}</span>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label className="text-sm font-medium">Ngôn ngữ</Label>
								<div className="h-10 flex items-center gap-2 text-sm p-2 border rounded-md bg-muted/30">
									<Globe className="h-4 w-4 text-muted-foreground" />
									<span className="text-foreground">
										{selectedLanguage?.name}
									</span>
								</div>
							</div>
						</div>
					</div>

					<div className="space-y-4">
						<h3 className="text-lg font-semibold flex items-center gap-2">
							<Settings className="h-5 w-5" />
							Cấu hình
						</h3>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="text-sm font-medium">Loại dữ liệu</Label>
								<Select
									value={formData.type || ""}
									onValueChange={(v) => setFormData({ ...formData, type: v })}
									disabled={loading}
								>
									<SelectTrigger className="!h-10 flex-1 w-full">
										<SelectValue placeholder="Chọn loại dữ liệu" />
									</SelectTrigger>
									<SelectContent>
										{ATTRIBUTE_TYPES.map((type) => (
											<SelectItem key={type.value} value={type.value}>
												<div className="flex items-center gap-3">
													{type.icon}
													<span>{type.label}</span>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label className="text-sm font-medium">Thứ tự hiển thị</Label>
								<div className="flex items-center gap-2">
									<div className="relative flex-1">
										<Input
											type="number"
											min="0"
											step="1"
											placeholder="0"
											value={formData.order || 0}
											onChange={(e) =>
												setFormData({
													...formData,
													order: Number(e.target.value)
												})
											}
											className="h-10 pl-10"
											disabled={loading}
										/>
										<Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									</div>
									<Button
										type="button"
										variant="outline"
										size="icon"
										className="h-10 w-10"
										onClick={() => handleOrderChange(-1)}
										disabled={loading}
									>
										<Minus className="h-4 w-4" />
									</Button>
									<Button
										type="button"
										variant="outline"
										size="icon"
										className="h-10 w-10"
										onClick={() => handleOrderChange(1)}
										disabled={loading}
									>
										<Plus className="h-4 w-4" />
									</Button>
									{!isEditing && (
										<Button
											type="button"
											variant="secondary"
											size="sm"
											className="h-10"
											onClick={handleSetMaxOrder}
											disabled={loading}
										>
											Max
										</Button>
									)}
								</div>
								<p className="text-xs text-muted-foreground">
									Số nhỏ hơn sẽ hiển thị trước
								</p>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="text-sm font-medium">Màu sắc</Label>
								<div className="flex items-center gap-2">
									<ColorPicker
										value={formData.color || "#3b82f6"}
										onChange={handleColorChange as any}
										className="h-10 w-10 border rounded-md"
									/>
									<Input
										placeholder="#000000"
										value={formData.color || ""}
										onChange={handleColorInputChange}
										className="h-10 flex-1"
										disabled={loading}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label className="text-sm font-medium">Trạng thái</Label>
								<Select
									value={formData.status || "active"}
									onValueChange={(v: "active" | "inactive") =>
										setFormData({ ...formData, status: v })
									}
									disabled={loading}
								>
									<SelectTrigger className="!h-10 w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="active">
											<div className="flex items-center gap-2">
												<Circle className="h-3 w-3 text-green-500 fill-green-500" />
												<span>Hoạt động</span>
											</div>
										</SelectItem>
										<SelectItem value="inactive">
											<div className="flex items-center gap-2">
												<CircleOff className="h-3 w-3 text-gray-400" />
												<span>Không hoạt động</span>
											</div>
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-2 w-full">
							<Label className="w-full text-sm font-medium">Hình ảnh</Label>
							<div className="space-y-3">
								{displayImage ? (
									<div className="space-y-2">
										<div className="border rounded-lg overflow-hidden relative group">
											<img
												src={displayImage}
												alt="Preview"
												className="w-full h-68 object-contain"
											/>
											<div className="absolute top-3 right-3 flex gap-2">
												<button
													onClick={() => {
														const input = document.createElement("input");
														input.type = "file";
														input.accept = "image/*";
														input.onchange = (e: any) => handleFileSelect(e);
														input.click();
													}}
													className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-colors"
													title="Chọn ảnh khác"
													type="button"
												>
													<Upload className="h-4 w-4" />
												</button>
												<button
													onClick={handleRemoveImage}
													className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors"
													title="Xóa ảnh"
													type="button"
													disabled={loading}
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</div>
										</div>
									</div>
								) : (
									<div className="relative">
										<Button
											type="button"
											variant="outline"
											className="h-50 w-full border-2 border-dashed hover:border-primary/50 hover:bg-primary/5 transition-colors"
											disabled={loading}
										>
											<div className="flex flex-col items-center gap-3">
												<div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
													<Upload className="h-6 w-6 text-primary" />
												</div>
												<div>
													<div className="font-medium">Chọn file ảnh</div>
													<div className="text-sm text-muted-foreground mt-1">
														JPG, PNG, GIF, WebP (tối đa 5MB)
													</div>
												</div>
											</div>
											<input
												type="file"
												accept="image/*"
												className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
												onChange={handleFileSelect}
												disabled={loading}
											/>
										</Button>
									</div>
								)}

								{selectedFile && !displayImage && (
									<div className="text-sm text-foreground bg-muted/30 p-3 rounded">
										<div className="font-medium">File đã chọn:</div>
										<div className="truncate">{selectedFile.name}</div>
										<div className="text-muted-foreground">
											Kích thước: {Math.round(selectedFile.size / 1024)} KB
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				<div className="flex justify-between items-center border-t px-6 py-4">
					<div className="text-sm text-muted-foreground">
						<span className="text-destructive">*</span> Trường bắt buộc
					</div>
					<div className="flex gap-3">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							className="h-10 px-6"
							disabled={loading}
						>
							Hủy
						</Button>
						<Button
							variant="outline"
							onClick={handleReset}
							className="h-10 px-6"
							disabled={loading}
						>
							Đặt lại
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={!formData.name?.trim() || loading}
							className="h-10 px-8 min-w-28"
						>
							{loading ? "Đang xử lý..." : isEditing ? "Cập nhật" : "Tạo mới"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
