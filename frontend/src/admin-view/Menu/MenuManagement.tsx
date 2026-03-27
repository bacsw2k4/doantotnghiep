"use client";

import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useMenus } from "@/hooks/useMenus";
import { MenuTable } from "./components/MenuTable";
import { MenuFormDialog } from "./components/MenuFormDialog";
import api from "@/services/api";

export interface Menu {
	id: number;
	lang_id: number;
	parentid: number | null;
	parentsid: string | null;
	name: string;
	desc: string | null;
	content: string | null;
	seotitle: string | null;
	seodesc: string | null;
	url: string | null;
	params: string | null;
	order: number;
	status: "active" | "inactive";
	createdate?: string;
	updatedate?: string | null;
	children?: Menu[];

	children_loaded?: boolean;
	children_loading?: boolean;
	expanded?: boolean;
	level?: number;
}

interface LayoutContext {
	selectedLangId: number;
	languages: { id: number; name: string }[];
}

const MenuManagement = () => {
	const { selectedLangId } = useOutletContext<LayoutContext>();

	const {
		treeData,
		flattened,
		loading,
		search,
		setSearch,
		toggleNode,
		refresh
	} = useMenus(selectedLangId);

	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [showDialog, setShowDialog] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState<Partial<Menu>>({});

	const handleOpenDialog = (menu?: Menu) => {
		if (menu) {
			setFormData(menu);
			setIsEditing(true);
		} else {
			setFormData({
				parentid: null,
				name: "",
				url: "",
				desc: "",
				content: "",
				seotitle: "",
				seodesc: "",
				params: "",
				order: 0,
				status: "active"
			});
			setIsEditing(false);
		}
		setShowDialog(true);
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Xóa menu này và tất cả menu con?")) return;
		try {
			await api.delete(`/menus/${id}`);
			toast.success("Xóa thành công");
			refresh();
		} catch {
			toast.error("Xóa thất bại");
		}
	};

	const handleDeleteMultiple = async () => {
		if (selectedIds.length === 0) {
			toast.error("Chưa chọn menu nào");
			return;
		}
		if (!confirm(`Xóa ${selectedIds.length} menu và tất cả menu con?`)) return;

		try {
			await api.post("/menus/delete-multiple", { ids: selectedIds });
			toast.success("Xóa nhiều thành công");
			setSelectedIds([]);
			refresh();
		} catch {
			toast.error("Xóa nhiều thất bại");
		}
	};

	const handleDialogSuccess = async () => {
		setShowDialog(false);
		refresh();
	};

	return (
		<div className="p-6 space-y-6">
			<Card>
				<CardHeader>
					<div className="flex flex-col sm:flex-row justify-between gap-4">
						<div className="flex items-center gap-3">
							<CardTitle className="text-2xl">Quản lý Menu</CardTitle>
							{loading && <Loader2 className="w-5 h-5 animate-spin" />}
						</div>

						<div className="flex flex-col sm:flex-row gap-3">
							<Input
								placeholder="Tìm kiếm menu..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="w-full sm:w-64"
							/>

							<div className="flex gap-2">
								<Button onClick={() => handleOpenDialog()}>+ Thêm mới</Button>
								<Button
									variant="destructive"
									onClick={handleDeleteMultiple}
									disabled={selectedIds.length === 0}
								>
									Xóa ({selectedIds.length})
								</Button>
							</div>
						</div>
					</div>
				</CardHeader>

				<CardContent>
					<MenuTable
						menus={treeData}
						flattened={flattened}
						selectedIds={selectedIds}
						setSelectedIds={setSelectedIds}
						onEdit={handleOpenDialog}
						onDelete={handleDelete}
						toggleNode={toggleNode}
					/>
				</CardContent>
			</Card>
			<MenuFormDialog
				open={showDialog}
				onOpenChange={setShowDialog}
				formData={formData}
				setFormData={setFormData}
				isEditing={isEditing}
				selectedLangId={selectedLangId}
				onSubmit={handleDialogSuccess}
				onGetMaxOrder={async (parentId) => {
					try {
						const res = await api.get("/menus/max-order", {
							params: { parentid: parentId ?? null, lang_id: selectedLangId }
						});
						return res.data.data.suggested_order;
					} catch {
						return 0;
					}
				}}
			/>
		</div>
	);
};

export default MenuManagement;
