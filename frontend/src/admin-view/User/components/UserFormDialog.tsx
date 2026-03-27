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
import {
	User as UserIcon,
	Upload,
	Trash2,
	Sparkles,
	Mail,
	Phone,
	MapPin,
	Lock
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

interface Role {
	id: number;
	name: string;
}

interface User {
	id: number;
	firstname: string;
	lastname: string;
	email: string;
	phone: string;
	address: string;
	avatar?: string;
	role: { id: number; name: string };
	status: "active" | "inactive";
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	formData: {
		id: number;
		firstname: string;
		lastname: string;
		email: string;
		phone: string;
		address: string;
		role_id: string;
		status: "active" | "inactive";
		password: string;
		avatar: File | string | null;
	};
	setFormData: (data: any) => void;
	isEditing: boolean;
	roles: Role[];
	onSubmit: (formData: FormData) => Promise<void>;
}

export const UserFormDialog = ({
	open,
	onOpenChange,
	formData,
	setFormData,
	isEditing,
	roles,
	onSubmit
}: Props) => {
	const [avatarPreview, setAvatarPreview] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Xử lý avatar preview khi mở dialog hoặc thay đổi formData.avatar
	useEffect(() => {
		if (!open) return;

		// Nếu đang edit và có avatar (có thể là string URL hoặc File)
		if (isEditing) {
			if (formData.avatar) {
				if (typeof formData.avatar === 'string') {
					// Là URL từ server
					setAvatarPreview(formData.avatar);
				} else if (formData.avatar instanceof File) {
					// Là File mới chọn
					const url = URL.createObjectURL(formData.avatar);
					setAvatarPreview(url);
					
					// Cleanup function
					return () => {
						URL.revokeObjectURL(url);
					};
				}
			} else {
				// Không có avatar
				setAvatarPreview("");
			}
		} else {
			// Tạo mới: chỉ hiển thị nếu có file
			if (formData.avatar instanceof File) {
				const url = URL.createObjectURL(formData.avatar);
				setAvatarPreview(url);
				
				return () => {
					URL.revokeObjectURL(url);
				};
			} else {
				setAvatarPreview("");
			}
		}
	}, [open, isEditing, formData.avatar]);

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
		if (file.size > 5 * 1024 * 1024) {
			toast.error("Ảnh không được quá 5MB");
			return;
		}

		// Set file vào formData
		setFormData({ ...formData, avatar: file });
		
		// Reset input để có thể chọn lại cùng 1 file
		if (e.target) e.target.value = "";
	};

	const handleRemoveAvatar = () => {
		setFormData({ ...formData, avatar: null });
		setAvatarPreview("");
	};

	const handleSubmit = async () => {
		if (!formData.firstname?.trim() || !formData.lastname?.trim()) {
			toast.error("Vui lòng nhập họ và tên");
			return;
		}
		if (!formData.email?.trim()) {
			toast.error("Vui lòng nhập email");
			return;
		}
		if (!isEditing && !formData.password?.trim()) {
			toast.error("Vui lòng nhập mật khẩu");
			return;
		}
		if (!formData.role_id) {
			toast.error("Vui lòng chọn vai trò");
			return;
		}

		setLoading(true);
		try {
			const fd = new FormData();

			fd.append("firstname", formData.firstname || "");
			fd.append("lastname", formData.lastname || "");
			fd.append("email", formData.email || "");
			fd.append("phone", formData.phone || "");
			fd.append("address", formData.address || "");
			fd.append("role_id", formData.role_id || "");
			fd.append("status", formData.status || "active");
			
			if (formData.password) {
				fd.append("password", formData.password);
			}
			
			// Chỉ append avatar nếu nó là File (ảnh mới chọn)
			if (formData.avatar instanceof File) {
				fd.append("avatar", formData.avatar);
			}
			// Nếu đang edit và avatar là null (người dùng đã xóa ảnh)
			else if (isEditing && formData.avatar === null) {
				// Gửi thông báo xóa ảnh (tùy API)
				fd.append("remove_avatar", "1");
			}

			await onSubmit(fd);
			toast.success(isEditing ? "Cập nhật user thành công" : "Tạo user thành công");
			onOpenChange(false);
		} catch (err: any) {
			console.error(err);
			toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
		} finally {
			setLoading(false);
		}
	};

	// Xác định hiển thị avatar nào
	const getDisplayAvatar = () => {
		if (avatarPreview) {
			return avatarPreview;
		}
		
		// Fallback: nếu formData.avatar là string URL (khi chưa có preview)
		if (typeof formData.avatar === 'string' && formData.avatar) {
			return formData.avatar;
		}
		
		return "";
	};

	const displayAvatar = getDisplayAvatar();

	// Kiểm tra roles và chuyển đổi thành mảng
	const rolesArray = Array.isArray(roles) ? roles : [];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="min-w-3xl max-h-[95vh] overflow-y-auto p-0">
				<DialogHeader className="px-6 pt-6 pb-4 border-b">
					<div className="flex items-center gap-3">
						<div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
							<Sparkles className="h-6 w-6 text-primary" />
						</div>
						<div>
							<DialogTitle className="text-2xl font-bold">
								{isEditing ? "Chỉnh sửa User" : "Tạo User Mới"}
							</DialogTitle>
							<p className="text-sm text-muted-foreground mt-1">
								Quản lý thông tin người dùng trong hệ thống
							</p>
						</div>
					</div>
				</DialogHeader>

				<div className="p-6 space-y-8">
					{/* === THÔNG TIN CÁ NHÂN === */}
					<div className="space-y-5">
						<h3 className="text-lg font-semibold flex items-center gap-2">
							<UserIcon className="h-5 w-5" />
							Thông tin cá nhân
						</h3>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="flex items-center gap-2">
									Họ <span className="text-destructive">*</span>
								</Label>
								<Input
									placeholder="Nhập họ..."
									value={formData.firstname || ""}
									onChange={(e) =>
										setFormData({ ...formData, firstname: e.target.value })
									}
									className="h-10"
								/>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center gap-2">
									Tên <span className="text-destructive">*</span>
								</Label>
								<Input
									placeholder="Nhập tên..."
									value={formData.lastname || ""}
									onChange={(e) =>
										setFormData({ ...formData, lastname: e.target.value })
									}
									className="h-10"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="flex items-center gap-2">
									<Mail className="h-4 w-4" />
									Email <span className="text-destructive">*</span>
								</Label>
								<Input
									type="email"
									placeholder="Nhập email..."
									value={formData.email || ""}
									onChange={(e) =>
										setFormData({ ...formData, email: e.target.value })
									}
									className="h-10"
								/>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center gap-2">
									<Phone className="h-4 w-4" />
									Số điện thoại
								</Label>
								<Input
									placeholder="Nhập số điện thoại..."
									value={formData.phone || ""}
									onChange={(e) =>
										setFormData({ ...formData, phone: e.target.value })
									}
									className="h-10"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<MapPin className="h-4 w-4" />
								Địa chỉ
							</Label>
							<Input
								placeholder="Nhập địa chỉ..."
								value={formData.address || ""}
								onChange={(e) =>
									setFormData({ ...formData, address: e.target.value })
								}
								className="h-10"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>
									Vai trò <span className="text-destructive">*</span>
								</Label>
								{rolesArray.length > 0 ? (
									<Select
										value={formData.role_id || ""}
										onValueChange={(v) =>
											setFormData({ ...formData, role_id: v })
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Chọn vai trò" />
										</SelectTrigger>
										<SelectContent>
											{rolesArray.map((role) => (
												<SelectItem key={role.id} value={role.id.toString()}>
													{role.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								) : (
									<div className="space-y-2">
										<Input
											value="Đang tải vai trò..."
											disabled
											className="h-10"
										/>
										<p className="text-xs text-muted-foreground">
											Không thể tải danh sách vai trò. Vui lòng thử lại sau.
										</p>
									</div>
								)}
							</div>

							<div className="space-y-2">
								<Label>Trạng thái</Label>
								<Select
									value={formData.status || "active"}
									onValueChange={(v) =>
										setFormData({ ...formData, status: v as "active" | "inactive" })
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="active">Hoạt động</SelectItem>
										<SelectItem value="inactive">Ngừng hoạt động</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					{/* === ẢNH ĐẠI DIỆN === */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold flex items-center gap-2">
							<UserIcon className="h-5 w-5" />
							Ảnh đại diện
						</h3>

						{displayAvatar ? (
							<div className="flex items-center gap-6">
								<div className="relative">
									<img
										src={displayAvatar}
										alt="Avatar preview"
										className="w-32 h-32 rounded-full object-cover border-2 border-muted"
									/>
									<div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
										<Button
											size="icon"
											variant="secondary"
											className="h-8 w-8 rounded-full"
											onClick={handleOpenFilePicker}
										>
											<Upload className="h-4 w-4" />
										</Button>
										<Button
											size="icon"
											variant="destructive"
											className="h-8 w-8 rounded-full"
											onClick={handleRemoveAvatar}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
								<div className="flex-1">
									<p className="text-sm text-muted-foreground">
										Click vào biểu tượng để thay đổi hoặc xóa ảnh đại diện
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										JPG, PNG, WebP • Tối đa 5MB
									</p>
								</div>
							</div>
						) : (
							<Button
								variant="outline"
								className="relative w-full h-32 border-2 border-dashed hover:border-primary/50"
								onClick={handleOpenFilePicker}
								type="button"
							>
								<div className="flex flex-col items-center gap-3">
									<div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
										<Upload className="h-6 w-6 text-primary" />
									</div>
									<div className="text-center">
										<p className="font-medium">Click để tải lên ảnh đại diện</p>
										<p className="text-sm text-muted-foreground mt-1">
											JPG, PNG, WebP • Tối đa 5MB
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

					{/* === MẬT KHẨU === */}
					<div className="space-y-5">
						<h3 className="text-lg font-semibold flex items-center gap-2">
							<Lock className="h-5 w-5" />
							Thông tin đăng nhập
						</h3>

						<div className="space-y-2">
							<Label>
								Mật khẩu {isEditing && <span className="text-muted-foreground text-sm">(để trống nếu không đổi)</span>}
								{!isEditing && <span className="text-destructive">*</span>}
							</Label>
							<Input
								type="password"
								placeholder={isEditing ? "Nhập mật khẩu mới (nếu muốn đổi)" : "Nhập mật khẩu"}
								value={formData.password || ""}
								onChange={(e) =>
									setFormData({ ...formData, password: e.target.value })
								}
								className="h-10"
							/>
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
							disabled={
								loading ||
								!formData.firstname?.trim() ||
								!formData.lastname?.trim() ||
								!formData.email?.trim() ||
								!formData.role_id ||
								(!isEditing && !formData.password?.trim()) ||
								rolesArray.length === 0
							}
						>
							{loading ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo User"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};