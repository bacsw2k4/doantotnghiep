// src/components/banners/BannerTable.tsx
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { type Banner } from "../BannerManagement"; // hoặc import từ BannerManagement
import { BannerRow } from "./BannerRow";
import { useRef, useEffect } from "react";

interface BannerTableProps {
	banners: Banner[]; // thay vì attributes
	selectedIds: number[];
	setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
	onEdit: (banner: Banner) => void;
	onDelete: (id: number) => void;
}

export const BannerTable = ({
	banners, // thay vì attributes
	selectedIds,
	setSelectedIds,
	onEdit,
	onDelete
}: BannerTableProps) => {
	const selectAllRef = useRef<HTMLButtonElement & { indeterminate?: boolean }>(
		null
	);

	// GIỐNG HỆT AttributeTable
	const isAllChecked =
		banners.length > 0 && selectedIds.length === banners.length;
	const isIndeterminate =
		selectedIds.length > 0 && selectedIds.length < banners.length;

	useEffect(() => {
		if (selectAllRef.current) {
			selectAllRef.current.indeterminate = isIndeterminate;
		}
	}, [isIndeterminate]);

	return (
		<div className="border rounded-lg overflow-hidden">
			<div className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow className="bg-gray-50">
							<TableHead className="w-12">
								<Checkbox
									ref={selectAllRef}
									checked={isAllChecked}
									onCheckedChange={(checked) => {
										setSelectedIds(checked ? banners.map((b) => b.id) : []); // banners thay vì flattened
									}}
								/>
							</TableHead>
							<TableHead className="w-16">ID</TableHead>
							<TableHead>Tiêu đề</TableHead>
							<TableHead>Phụ đề</TableHead>
							<TableHead>Hình ảnh</TableHead>
							<TableHead>CTA Text</TableHead>
							<TableHead>CTA Link</TableHead>
							<TableHead>Badge</TableHead>
							<TableHead>Theme</TableHead>
							<TableHead className="w-20 text-center">Thứ tự</TableHead>
							<TableHead className="w-28">Trạng thái</TableHead>
							<TableHead className="w-32">Hành động</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{banners.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={12}
									className="h-24 text-center text-gray-500"
								>
									Không có dữ liệu
								</TableCell>
							</TableRow>
						) : (
							banners.map((banner) => (
								<BannerRow
									key={banner.id}
									banner={banner}
									selectedIds={selectedIds}
									setSelectedIds={setSelectedIds}
									onEdit={onEdit}
									onDelete={onDelete}
								/>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
};
