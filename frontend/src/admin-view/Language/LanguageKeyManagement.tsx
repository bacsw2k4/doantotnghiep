import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "../../components/ui/table";
import { Checkbox } from "../../components/ui/checkbox";
import { toast } from "react-toastify";
import { Plus, Trash2, Search, Save } from "lucide-react";
import { ScrollArea } from "../../components/ui/scroll-area";
import axios from "axios";
import api from "@/services/api";

interface LanguageKey {
	id: number;
	title: string;
	desc?: string;
}

interface NewLanguageKey {
	tempId: string;
	title: string;
	desc?: string;
}

const LanguageKeyManagement = () => {
	const [allLanguageKeys, setAllLanguageKeys] = useState<LanguageKey[]>([]);
	const [originalLanguageKeys, setOriginalLanguageKeys] = useState<
		LanguageKey[]
	>([]);
	const [displayedLanguageKeys, setDisplayedLanguageKeys] = useState<
		LanguageKey[]
	>([]);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(false);
	const [newKeys, setNewKeys] = useState<NewLanguageKey[]>([
		{ tempId: Date.now().toString(), title: "", desc: "" }
	]);

	const fetchLanguageKeys = async () => {
		setLoading(true);
		try {
			const res = await api.get("/language-keys");
			const keys = res.data.data || [];
			setAllLanguageKeys(keys);
			setOriginalLanguageKeys(keys);
			setDisplayedLanguageKeys(keys);
		} catch {
			toast.error("Không lấy được danh sách language keys");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLanguageKeys();
	}, []);

	useEffect(() => {
		if (!search) {
			setDisplayedLanguageKeys(allLanguageKeys);
			return;
		}
		const filtered = allLanguageKeys.filter(
			(key) =>
				key.title.toLowerCase().includes(search.toLowerCase()) ||
				key.desc?.toLowerCase().includes(search.toLowerCase())
		);
		setDisplayedLanguageKeys(filtered);
	}, [search, allLanguageKeys]);

	const handleDelete = async (id: number) => {
		if (!confirm("Bạn có chắc muốn xóa language key này?")) return;
		try {
			await api.delete(`/language-keys/${id}`);
			toast.success("Xóa thành công");
			fetchLanguageKeys();
		} catch {
			toast.error("Xóa thất bại");
		}
	};

	const handleDeleteMultiple = async () => {
		if (selectedIds.length === 0) {
			toast.error("Chưa chọn language key để xóa");
			return;
		}
		if (!confirm(`Bạn có chắc muốn xóa ${selectedIds.length} language key?`))
			return;
		try {
			await api.post("/language-keys/delete-multiple", { ids: selectedIds });
			toast.success("Xóa thành công");
			setSelectedIds([]);
			fetchLanguageKeys();
		} catch {
			toast.error("Xóa thất bại");
		}
	};

	const handleAddNewRow = () => {
		setNewKeys([
			...newKeys,
			{ tempId: Date.now().toString(), title: "", desc: "" }
		]);
	};

	const handleKeyChange = (
		id: number,
		field: keyof LanguageKey,
		value: string
	) => {
		setAllLanguageKeys(
			allLanguageKeys.map((key) =>
				key.id === id ? { ...key, [field]: value } : key
			)
		);
	};

	const handleNewKeyChange = (
		tempId: string,
		field: keyof NewLanguageKey,
		value: string
	) => {
		setNewKeys(
			newKeys.map((key) =>
				key.tempId === tempId ? { ...key, [field]: value } : key
			)
		);
	};

	const handleSaveAll = async () => {
		const validNewKeys = newKeys
			.filter((k) => k.title.trim())
			.map((k) => ({ title: k.title.trim(), desc: k.desc?.trim() || null }));

		const changedKeys = allLanguageKeys
			.map((key) => {
				const orig = originalLanguageKeys.find((o) => o.id === key.id);
				if (!orig) return null;
				if (
					key.title.trim() !== orig.title.trim() ||
					(key.desc || "") !== (orig.desc || "")
				) {
					return {
						id: key.id,
						title: key.title.trim(),
						desc: key.desc?.trim() || null
					};
				}
				return null;
			})
			.filter(Boolean) as { id: number; title: string; desc: string | null }[];

		if (validNewKeys.length === 0 && changedKeys.length === 0) {
			toast.info("Không có thay đổi nào");
			return;
		}

		try {
			if (validNewKeys.length > 0) {
				await api.post("/language-keys", { keys: validNewKeys });
			}

			if (changedKeys.length > 0) {
				await api.put("/language-keys", { keys: changedKeys });
			}

			toast.success("Lưu tất cả thành công!");
			setNewKeys([{ tempId: Date.now().toString(), title: "", desc: "" }]);
			fetchLanguageKeys();
		} catch (error: any) {
			const msg = error.response?.data?.message || "Lưu thất bại";
			toast.error(msg);
		}
	};

	if (loading && allLanguageKeys.length === 0) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="text-gray-500">Đang tải...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
			<div className="w-full">
				<Card className="border shadow-sm bg-white">
					<CardHeader className="border-b text-black py-6 px-8">
						<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
							<CardTitle className="text-2xl font-bold">
								Quản lý Language Keys
							</CardTitle>
							<div className="flex flex-wrap gap-2">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
									<Input
										placeholder="Tìm kiếm language key..."
										value={search}
										onChange={(e) => setSearch(e.target.value)}
										className="pl-10 w-64 bg-white"
									/>
								</div>
								<Button
									onClick={handleAddNewRow}
									className="bg-white text-black hover:bg-gray-100"
								>
									<Plus className="h-4 w-4 mr-2" />
									Thêm hàng
								</Button>
								<Button
									variant="destructive"
									onClick={handleDeleteMultiple}
									disabled={selectedIds.length === 0}
								>
									<Trash2 className="h-4 w-4 mr-2" />
									Xóa ({selectedIds.length})
								</Button>
								<Button
									onClick={handleSaveAll}
									className="bg-green-600 text-white hover:bg-green-700"
								>
									<Save className="h-4 w-4 mr-2" />
									Lưu tất cả
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<ScrollArea className="h-[calc(100vh-250px)]">
							<Table>
								<TableHeader className="bg-gray-50 sticky top-0 z-10">
									<TableRow>
										<TableHead className="w-12">
											<Checkbox
												checked={
													selectedIds.length === displayedLanguageKeys.length &&
													displayedLanguageKeys.length > 0
												}
												onCheckedChange={(checked) =>
													setSelectedIds(
														checked
															? displayedLanguageKeys.map((key) => key.id)
															: []
													)
												}
											/>
										</TableHead>
										<TableHead className="w-16">ID</TableHead>
										<TableHead>Tên Key</TableHead>
										<TableHead>Mô tả</TableHead>
										<TableHead className="text-right w-24">Hành động</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{displayedLanguageKeys.map((key) => (
										<TableRow key={key.id} className="hover:bg-gray-50">
											<TableCell>
												<Checkbox
													checked={selectedIds.includes(key.id)}
													onCheckedChange={(checked) =>
														setSelectedIds(
															checked
																? [...selectedIds, key.id]
																: selectedIds.filter((id) => id !== key.id)
														)
													}
												/>
											</TableCell>
											<TableCell className="font-medium text-gray-600">
												{key.id}
											</TableCell>
											<TableCell>
												<Input
													value={key.title}
													onChange={(e) =>
														handleKeyChange(key.id, "title", e.target.value)
													}
													className="h-8"
												/>
											</TableCell>
											<TableCell>
												<Input
													value={key.desc || ""}
													onChange={(e) =>
														handleKeyChange(key.id, "desc", e.target.value)
													}
													className="h-8"
												/>
											</TableCell>
											<TableCell>
												<Button
													size="sm"
													variant="outline"
													className="text-red-600 hover:bg-red-50 hover:text-red-700"
													onClick={() => handleDelete(key.id)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</TableCell>
										</TableRow>
									))}
									{newKeys.map((newKey) => (
										<TableRow key={newKey.tempId} className="bg-gray-100">
											<TableCell></TableCell>
											<TableCell>-</TableCell>
											<TableCell>
												<Input
													value={newKey.title}
													onChange={(e) =>
														handleNewKeyChange(
															newKey.tempId,
															"title",
															e.target.value
														)
													}
													placeholder="Nhập tên key"
													className="h-8"
												/>
											</TableCell>
											<TableCell>
												<Input
													value={newKey.desc || ""}
													onChange={(e) =>
														handleNewKeyChange(
															newKey.tempId,
															"desc",
															e.target.value
														)
													}
													placeholder="Nhập mô tả"
													className="h-8"
												/>
											</TableCell>
											<TableCell></TableCell>
										</TableRow>
									))}
									{displayedLanguageKeys.length === 0 &&
										newKeys.length === 0 && (
											<TableRow>
												<TableCell
													colSpan={5}
													className="text-center text-gray-500 h-32"
												>
													{search
														? "Không tìm thấy language key phù hợp"
														: "Chưa có language key nào"}
												</TableCell>
											</TableRow>
										)}
								</TableBody>
							</Table>
						</ScrollArea>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default LanguageKeyManagement;
