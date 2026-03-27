import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CategoryRow } from "./CategoryRow";
import { useRef, useEffect } from "react";
import type { Category } from "../CategoryManagement"; 

interface CategoryTableProps {
	categories: Category[];
	selectedIds: number[];
	setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
	allAttributes: any[];
	onEdit: (category: Category) => void;
	onDelete: (id: number) => void;
}

export const CategoryTable = ({
	categories,
	selectedIds,
	setSelectedIds,
	allAttributes,
	onEdit,
	onDelete
}: CategoryTableProps) => {
	const selectAllRef = useRef<HTMLButtonElement & { indeterminate?: boolean }>(
		null
	);

	const flattenCategories = (nodes: Category[]): Category[] => {
		let flat: Category[] = [];
		nodes.forEach((n) => {
			flat.push(n);
			if (n.children) flat = flat.concat(flattenCategories(n.children));
		});
		return flat;
	};

	const allFlattened = flattenCategories(categories);
	const isAllChecked = allFlattened.length > 0 && selectedIds.length === allFlattened.length;
	const isIndeterminate = selectedIds.length > 0 && selectedIds.length < allFlattened.length;

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
										setSelectedIds(checked ? allFlattened.map((c) => c.id) : []);
									}}
								/>
							</TableHead>
							<TableHead className="w-16">ID</TableHead>
							<TableHead>Tên</TableHead>
							<TableHead>Hình ảnh</TableHead>
							<TableHead>Thuộc tính</TableHead>
							<TableHead className="w-20 text-center">Thứ tự</TableHead>
							<TableHead className="w-28">Trạng thái</TableHead>
							<TableHead className="w-32">Hành động</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{categories.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={9}
									className="h-24 text-center text-gray-500"
								>
									Không có dữ liệu
								</TableCell>
							</TableRow>
						) : (
							categories.map((category) => (
								<CategoryRow
									key={category.id}
									category={category}
									level={0}
									selectedIds={selectedIds}
									setSelectedIds={setSelectedIds}
									allAttributes={allAttributes}
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