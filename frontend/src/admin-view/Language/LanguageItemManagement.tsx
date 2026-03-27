import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "../../components/ui/select";
import api from "@/services/api";

interface LanguageKey {
	id: number;
	title: string;
}

interface LanguageItem {
	id: number;
	language_id: number;
	language_key_id: number;
	title: string;
	desc?: string;
	status: string;
}

interface NewLanguageItem {
	tempId: string;
	language_key_id: number;
	title: string;
	desc?: string;
	status: string;
}

interface Language {
	id: number;
	name: string;
	image?: string;
	desc?: string;
	order: number;
	status: string;
}

interface LayoutContext {
	selectedLangId: number;
	setSelectedLangId: (id: number) => void;
	languages: Language[];
}

const LanguageItemManagement = () => {
	const { selectedLangId, languages } =
		useOutletContext<LayoutContext>();
	const [allLanguageItems, setAllLanguageItems] = useState<LanguageItem[]>([]);
	const [originalLanguageItems, setOriginalLanguageItems] = useState<
		LanguageItem[]
	>([]);
	const [displayedLanguageItems, setDisplayedLanguageItems] = useState<
		LanguageItem[]
	>([]);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(false);
	const [languageKeys, setLanguageKeys] = useState<LanguageKey[]>([]);
	const [availableLanguageKeys, setAvailableLanguageKeys] = useState<
		LanguageKey[]
	>([]);
	const [newItems, setNewItems] = useState<NewLanguageItem[]>([
		{
			tempId: Date.now().toString(),
			language_key_id: 0,
			title: "",
			desc: "",
			status: "active"
		}
	]);

	const fetchLanguageKeys = async () => {
		try {
			const res = await api.get("/language-keys");
			setLanguageKeys(res.data.data || []);
		} catch {
			toast.error("Không lấy được danh sách language keys");
		}
	};

	const fetchLanguageItems = async (langId: number) => {
		setLoading(true);
		try {
			const res = await api.get(`/language-items?language_id=${langId}`);
			const items = res.data.data || [];
			setAllLanguageItems(items);
			setOriginalLanguageItems(structuredClone(items));
			setDisplayedLanguageItems(items);
		} catch {
			toast.error("Không lấy được danh sách language items");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLanguageKeys();
		if (languages.length > 0) {
			fetchLanguageItems(selectedLangId);
		}
	}, [selectedLangId, languages.length]);

	useEffect(() => {
		const usedKeyIds = allLanguageItems.map((item) => item.language_key_id);
		const availableKeys = languageKeys.filter(
			(key) => !usedKeyIds.includes(key.id)
		);
		setAvailableLanguageKeys(availableKeys);
	}, [languageKeys, allLanguageItems]);

	useEffect(() => {
		if (!search) {
			setDisplayedLanguageItems(allLanguageItems);
			return;
		}
		const filtered = allLanguageItems.filter(
			(item) =>
				item.title.toLowerCase().includes(search.toLowerCase()) ||
				item.desc?.toLowerCase().includes(search.toLowerCase())
		);
		setDisplayedLanguageItems(filtered);
	}, [search, allLanguageItems]);

	const handleDelete = async (id: number) => {
		if (!confirm("Bạn có chắc muốn xóa language item này?")) return;
		try {
			await api.delete(`/language-items/${id}`);
			toast.success("Xóa thành công");
			setAllLanguageItems((prev) => prev.filter((item) => item.id !== id));
			setOriginalLanguageItems((prev) => prev.filter((item) => item.id !== id));
			await fetchLanguageItems(selectedLangId);
		} catch {
			toast.error("Xóa thất bại");
		}
	};

	const handleDeleteMultiple = async () => {
		if (selectedIds.length === 0) {
			toast.error("Chưa chọn language item để xóa");
			return;
		}
		if (!confirm(`Bạn có chắc muốn xóa ${selectedIds.length} language item?`))
			return;
		try {
			await api.post("/language-items/delete-multiple", { ids: selectedIds });
			toast.success("Xóa thành công");
			setSelectedIds([]);
			await fetchLanguageItems(selectedLangId);
		} catch {
			toast.error("Xóa thất bại");
		}
	};

	const handleAddNewRow = () => {
		setNewItems([
			...newItems,
			{
				tempId: Date.now().toString(),
				language_key_id: 0,
				title: "",
				desc: "",
				status: "active"
			}
		]);
	};

	const handleItemChange = (
		id: number,
		field: keyof LanguageItem,
		value: string | number
	) => {
		setAllLanguageItems(
			allLanguageItems.map((item) =>
				item.id === id ? { ...item, [field]: value } : item
			)
		);
	};

	const handleNewItemChange = (
		tempId: string,
		field: keyof NewLanguageItem,
		value: string | number
	) => {
		setNewItems(
			newItems.map((item) =>
				item.tempId === tempId ? { ...item, [field]: value } : item
			)
		);
	};

	const handleSaveAll = async () => {
		// 1. Các bản dịch mới
		const validNewItems = newItems
			.filter((item) => item.title.trim() && item.language_key_id > 0)
			.map((item) => ({
				language_key_id: item.language_key_id,
				title: item.title.trim(),
				desc: item.desc?.trim() || null,
				status: item.status
			}));

		// 2. Các bản dịch cũ đã sửa
		const changedItems = allLanguageItems
			.filter((item) => {
				const orig = originalLanguageItems.find((o) => o.id === item.id);
				if (!orig) return false;
				return (
					item.title.trim() !== orig.title.trim() ||
					(item.desc?.trim() || "") !== (orig.desc?.trim() || "") ||
					item.status !== orig.status ||
					item.language_key_id !== orig.language_key_id
				);
			})
			.map((item) => ({
				id: item.id,
				title: item.title.trim(),
				desc: item.desc?.trim() || null,
				status: item.status,
				...(item.language_key_id !==
					originalLanguageItems.find((o) => o.id === item.id)
						?.language_key_id && {
					language_key_id: item.language_key_id
				})
			}));

		if (validNewItems.length === 0 && changedItems.length === 0) {
			toast.info("Không có thay đổi nào");
			return;
		}

		try {
			if (validNewItems.length > 0) {
				await api.post(`/language-items?language_id=${selectedLangId}`, {
					items: validNewItems
				});
			}

			if (changedItems.length > 0) {
				await api.put(`/language-items?language_id=${selectedLangId}`, {
					items: changedItems
				});
			}

			toast.success("Lưu tất cả thành công!");
			setNewItems([
				{
					tempId: Date.now().toString(),
					language_key_id: 0,
					title: "",
					desc: "",
					status: "active"
				}
			]);
			await fetchLanguageItems(selectedLangId);
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Lưu thất bại");
		}
	};

	if (loading && allLanguageItems.length === 0) {
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
								Quản lý Language Items
							</CardTitle>
							<div className="flex flex-wrap gap-2">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
									<Input
										placeholder="Tìm kiếm language item..."
										value={search}
										onChange={(e) => setSearch(e.target.value)}
										className="pl-10 w-64 bg-white"
									/>
								</div>
								<Button
									onClick={handleAddNewRow}
									className="bg-white text-black hover:bg-gray-100"
									disabled={availableLanguageKeys.length === 0}
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
									disabled={loading}
								>
									<Save className="h-4 w-4 mr-2" />
									{loading ? "Đang lưu..." : "Lưu tất cả"}
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
													selectedIds.length ===
														displayedLanguageItems.length &&
													displayedLanguageItems.length > 0
												}
												onCheckedChange={(checked) =>
													setSelectedIds(
														checked
															? displayedLanguageItems.map((item) => item.id)
															: []
													)
												}
											/>
										</TableHead>
										<TableHead className="w-16">ID</TableHead>
										<TableHead>Key</TableHead>
										<TableHead>Tiêu đề</TableHead>
										<TableHead>Mô tả</TableHead>
										<TableHead className="w-28">Trạng thái</TableHead>
										<TableHead className="text-right w-24">Hành động</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{displayedLanguageItems.map((item) => (
										<TableRow key={item.id} className="hover:bg-gray-50">
											<TableCell>
												<Checkbox
													checked={selectedIds.includes(item.id)}
													onCheckedChange={(checked) =>
														setSelectedIds(
															checked
																? [...selectedIds, item.id]
																: selectedIds.filter((id) => id !== item.id)
														)
													}
												/>
											</TableCell>
											<TableCell className="font-medium text-gray-600">
												{item.id}
											</TableCell>
											<TableCell>
												<Select
													value={item.language_key_id.toString()}
													onValueChange={(val) =>
														handleItemChange(
															item.id,
															"language_key_id",
															Number(val)
														)
													}
												>
													<SelectTrigger className="h-8 w-full">
														<SelectValue
															placeholder="Chọn key"
															className="w-full"
														/>
													</SelectTrigger>
													<SelectContent>
														{[
															languageKeys.find(
																(key) => key.id === item.language_key_id
															),
															...availableLanguageKeys
														]
															.filter((key): key is LanguageKey => !!key)
															.map((key) => (
																<SelectItem
																	key={key.id}
																	value={key.id.toString()}
																>
																	{key.title}
																</SelectItem>
															))}
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell>
												<Input
													value={item.title}
													onChange={(e) =>
														handleItemChange(item.id, "title", e.target.value)
													}
													className="h-8"
												/>
											</TableCell>
											<TableCell>
												<Input
													value={item.desc || ""}
													onChange={(e) =>
														handleItemChange(item.id, "desc", e.target.value)
													}
													className="h-8"
												/>
											</TableCell>
											<TableCell>
												<Select
													value={item.status}
													onValueChange={(val) =>
														handleItemChange(item.id, "status", val)
													}
												>
													<SelectTrigger className="h-8">
														<SelectValue placeholder="Chọn trạng thái" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="active">Active</SelectItem>
														<SelectItem value="inactive">Inactive</SelectItem>
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell>
												<Button
													size="sm"
													variant="outline"
													className="text-red-600 hover:bg-red-50 hover:text-red-700"
													onClick={() => handleDelete(item.id)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</TableCell>
										</TableRow>
									))}
									{newItems.map((newItem) => (
										<TableRow key={newItem.tempId} className="bg-gray-100">
											<TableCell></TableCell>
											<TableCell>-</TableCell>
											<TableCell>
												<Select
													value={newItem.language_key_id.toString()}
													onValueChange={(val) =>
														handleNewItemChange(
															newItem.tempId,
															"language_key_id",
															Number(val)
														)
													}
												>
													<SelectTrigger className="h-8 w-full">
														<SelectValue placeholder="Chọn key" />
													</SelectTrigger>
													<SelectContent>
														{availableLanguageKeys.map((key) => (
															<SelectItem
																key={key.id}
																value={key.id.toString()}
															>
																{key.title}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell>
												<Input
													value={newItem.title}
													onChange={(e) =>
														handleNewItemChange(
															newItem.tempId,
															"title",
															e.target.value
														)
													}
													placeholder="Nhập tiêu đề"
													className="h-8"
												/>
											</TableCell>
											<TableCell>
												<Input
													value={newItem.desc || ""}
													onChange={(e) =>
														handleNewItemChange(
															newItem.tempId,
															"desc",
															e.target.value
														)
													}
													placeholder="Nhập mô tả"
													className="h-8"
												/>
											</TableCell>
											<TableCell>
												<Select
													value={newItem.status}
													onValueChange={(val) =>
														handleNewItemChange(newItem.tempId, "status", val)
													}
												>
													<SelectTrigger className="h-8">
														<SelectValue placeholder="Chọn trạng thái" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="active">Active</SelectItem>
														<SelectItem value="inactive">Inactive</SelectItem>
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell></TableCell>
										</TableRow>
									))}
									{displayedLanguageItems.length === 0 &&
										newItems.length === 0 && (
											<TableRow>
												<TableCell
													colSpan={7}
													className="text-center text-gray-500 h-32"
												>
													{search
														? "Không tìm thấy language item phù hợp"
														: "Chưa có language item nào"}
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

export default LanguageItemManagement;
