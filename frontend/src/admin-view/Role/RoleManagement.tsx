// src/pages/roles/RoleManagement.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Search, Plus, Trash2 } from "lucide-react";
import { RoleTable } from "./components/RoleTable";
import { RoleFormDialog } from "./components/RoleFormDialog";
import api from "@/services/api";

interface Role {
	id: number;
	name: string;
	description: string;
	created_at?: string;
	updated_at?: string;
}

const RoleManagement = () => {
	const [roles, setRoles] = useState<Role[]>([]);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(false);

	const [showDialog, setShowDialog] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	const [formData, setFormData] = useState<Partial<Role>>({
		id: 0,
		name: "",
		description: ""
	});

	const fetchRoles = async () => {
		setLoading(true);
		try {
			const res = await api.get("/roles", { 
				params: { 
					search: search || undefined 
				} 
			});
			const data = res.data.data?.data || res.data.data || res.data || [];
			setRoles(data);
		} catch (err: any) {
			console.error(err);
			toast.error("Không lấy được danh sách roles");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchRoles();
	}, [search]);

	const filteredRoles = search
		? roles.filter((r) =>
				r.name.toLowerCase().includes(search.toLowerCase()) ||
				(r.description?.toLowerCase() || "").includes(search.toLowerCase())
		  )
		: roles;

	const openAddDialog = () => {
		setIsEditing(false);
		setFormData({
			id: 0,
			name: "",
			description: ""
		});
		setShowDialog(true);
	};

	const openEditDialog = (role: Role) => {
		setIsEditing(true);
		setFormData({ ...role });
		setShowDialog(true);
	};

	const handleSave = async (data: Partial<Role>) => {
		try {
			if (isEditing && formData.id) {
				await api.put(`/roles/${formData.id}`, data);
				toast.success("Cập nhật role thành công");
			} else {
				await api.post("/roles", data);
				toast.success("Tạo role thành công");
			}

			setShowDialog(false);
			fetchRoles();
		} catch (err: any) {
			console.error(err);
			toast.error(err.response?.data?.message || "Lỗi khi lưu role");
			throw err;
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Bạn có chắc muốn xóa role này?")) return;
		try {
			await api.delete(`/roles/${id}`);
			toast.success("Xóa thành công");
			fetchRoles();
		} catch {
			toast.error("Xóa thất bại");
		}
	};

	const handleDeleteMultiple = async () => {
		if (selectedIds.length === 0) {
			toast.error("Chưa chọn role nào");
			return;
		}
		if (!confirm(`Xóa ${selectedIds.length} role đã chọn?`)) return;

		try {
			await api.post("/roles/delete-multiple", { ids: selectedIds });
			toast.success("Xóa nhiều thành công");
			setSelectedIds([]);
			fetchRoles();
		} catch {
			toast.error("Xóa nhiều thất bại");
		}
	};

	return (
		<div className="p-6 space-y-6">
			<Card>
				<CardHeader>
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
						<div className="flex items-center gap-3">
							<CardTitle className="text-2xl font-bold">Quản lý Roles</CardTitle>
							{loading && <Loader2 className="w-5 h-5 animate-spin" />}
						</div>

						<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
								<Input
									placeholder="Tìm kiếm role..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="pl-9 w-full sm:w-64"
								/>
							</div>

							<div className="flex gap-2">
								<Button onClick={openAddDialog} className="flex items-center gap-2">
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

				<CardContent>
					<RoleTable
						roles={filteredRoles}
						selectedIds={selectedIds}
						setSelectedIds={setSelectedIds}
						onEdit={openEditDialog}
						onDelete={handleDelete}
					/>
				</CardContent>
			</Card>

			<RoleFormDialog
				open={showDialog}
				onOpenChange={setShowDialog}
				formData={formData}
				setFormData={setFormData}
				isEditing={isEditing}
				onSubmit={handleSave}
			/>
		</div>
	);
};

export default RoleManagement;