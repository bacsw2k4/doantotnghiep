// src/pages/roles/components/RoleFormDialog.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from "@/components/ui/dialog";
import { Shield, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Role {
	id: number;
	name: string;
	description: string;
	created_at?: string;
	updated_at?: string;
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	formData: Partial<Role>;
	setFormData: (data: Partial<Role>) => void;
	isEditing: boolean;
	onSubmit: (data: Partial<Role>) => Promise<void>;
}

export const RoleFormDialog = ({
	open,
	onOpenChange,
	formData,
	setFormData,
	isEditing,
	onSubmit
}: Props) => {
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		if (!formData.name?.trim()) {
			toast.error("Vui lòng nhập tên role");
			return;
		}

		setLoading(true);
		try {
			await onSubmit(formData);
			toast.success(isEditing ? "Cập nhật role thành công" : "Tạo role thành công");
			onOpenChange(false);
		} catch (err: any) {
			console.error(err);
			toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="min-w-2xl max-h-[95vh] overflow-y-auto p-0">
				<DialogHeader className="px-6 pt-6 pb-4 border-b">
					<div className="flex items-center gap-3">
						<div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
							<Sparkles className="h-6 w-6 text-primary" />
						</div>
						<div>
							<DialogTitle className="text-2xl font-bold">
								{isEditing ? "Chỉnh sửa Role" : "Tạo Role Mới"}
							</DialogTitle>
							<p className="text-sm text-muted-foreground mt-1">
								Quản lý vai trò và phân quyền trong hệ thống
							</p>
						</div>
					</div>
				</DialogHeader>

				<div className="p-6 space-y-8">
					{/* === THÔNG TIN CƠ BẢN === */}
					<div className="space-y-5">
						<h3 className="text-lg font-semibold flex items-center gap-2">
							<Shield className="h-5 w-5" />
							Thông tin Role
						</h3>

						<div className="space-y-4">
							<div className="space-y-2">
								<Label>
									Tên Role <span className="text-destructive">*</span>
								</Label>
								<Input
									placeholder="Nhập tên role..."
									value={formData.name || ""}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									className="h-11 text-lg font-medium"
								/>
							</div>

							<div className="space-y-2">
								<Label>Mô tả</Label>
								<Textarea
									placeholder="Mô tả chi tiết về vai trò và quyền hạn..."
									rows={4}
									value={formData.description || ""}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
								/>
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
							disabled={loading || !formData.name?.trim()}
						>
							{loading ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo Role"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};