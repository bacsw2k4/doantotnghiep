"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/services/api";
import { Loader2, Search, Plus, Trash2 } from "lucide-react";
import { UserTable } from "./components/UserTable";
import { UserFormDialog } from "./components/UserFormDialog";
import { DataTablePagination } from "@/components/dataTablePagination";
import { useUsers, type User } from "@/hooks/useUsers";

interface Role {
	id: number;
	name: string;
}

const UserManagement = () => {
	const {
		users,
		search,
		setSearch,
		goToPage,
		changePerPage,
		pagination,
		refresh,
		loading
	} = useUsers();

	const [roles, setRoles] = useState<Role[]>([]);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);

	const [showDialog, setShowDialog] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	const [formData, setFormData] = useState({
		id: 0,
		firstname: "",
		lastname: "",
		email: "",
		phone: "",
		address: "",
		role_id: "",
		status: "active" as "active" | "inactive",
		password: "",
		avatar: null as File | null | string
	});

	const fetchRoles = async () => {
		try {
			const res = await api.get("/roles");
			setRoles(res.data.data.data || []);
		} catch (err: any) {
			console.error(err);
			toast.error("Không lấy được danh sách roles");
		}
	};

	useEffect(() => {
		fetchRoles();
	}, []);

	const openAddDialog = () => {
		setIsEditing(false);
		setFormData({
			id: 0,
			firstname: "",
			lastname: "",
			email: "",
			phone: "",
			address: "",
			role_id: "",
			status: "active",
			password: "",
			avatar: null
		});
		setShowDialog(true);
	};

	const openEditDialog = (user: User) => {
		setIsEditing(true);
		setFormData({
			id: user.id,
			firstname: user.firstname,
			lastname: user.lastname,
			email: user.email,
			phone: user.phone || "",
			address: user.address || "",
			role_id: user.role?.id?.toString() || "",
			status: user.status,
			password: "",
			avatar: user.avatar || null
		});
		setShowDialog(true);
	};

	const handleSave = async (formDataFromDialog: FormData) => {
		try {
			if (isEditing && formData.id) {
				formDataFromDialog.append("_method", "PUT");
				await api.post(`/users/${formData.id}`, formDataFromDialog, {
					headers: { "Content-Type": "multipart/form-data" }
				});
				toast.success("Cập nhật user thành công");
			} else {
				await api.post("/users", formDataFromDialog, {
					headers: { "Content-Type": "multipart/form-data" }
				});
				toast.success("Tạo user thành công");
			}

			setShowDialog(false);
			refresh();
		} catch (err: any) {
			console.error(err);
			toast.error(err.response?.data?.message || "Lỗi khi lưu user");
			throw err;
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Bạn có chắc muốn xóa user này?")) return;
		try {
			await api.delete(`/users/${id}`);
			toast.success("Xóa thành công");
			refresh();
		} catch {
			toast.error("Xóa thất bại");
		}
	};

	const handleDeleteMultiple = async () => {
		if (selectedIds.length === 0) {
			toast.error("Chưa chọn user nào");
			return;
		}
		if (!confirm(`Xóa ${selectedIds.length} user đã chọn?`)) return;

		try {
			await api.post("/users/delete-multiple", { ids: selectedIds });
			toast.success("Xóa nhiều thành công");
			setSelectedIds([]);
			refresh();
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
							<CardTitle className="text-2xl font-bold">
								Quản lý Users
							</CardTitle>
							{loading && <Loader2 className="w-5 h-5 animate-spin" />}
						</div>

						<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
								<Input
									placeholder="Tìm kiếm user..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="pl-9 w-full sm:w-64"
								/>
							</div>

							<div className="flex gap-2">
								<Button
									onClick={openAddDialog}
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
					<UserTable
						users={users}
						selectedIds={selectedIds}
						setSelectedIds={setSelectedIds}
						onEdit={openEditDialog}
						onDelete={handleDelete}
					/>

					{/* Phân trang */}
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

			<UserFormDialog
				open={showDialog}
				onOpenChange={setShowDialog}
				formData={formData}
				setFormData={setFormData}
				isEditing={isEditing}
				roles={roles}
				onSubmit={handleSave}
			/>
		</div>
	);
};

export default UserManagement;
