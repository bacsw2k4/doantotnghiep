import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { type Attribute } from "@/hooks/useAttributes";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";

interface AttributeRowProps {
	attr: Attribute;
	selectedIds: number[];
	setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
	onEdit: (attr: Attribute) => void;
	onDelete: (id: number) => void;
	toggleNode: (id: number) => void;
}

export const AttributeRow = ({
	attr,
	selectedIds,
	setSelectedIds,
	onEdit,
	onDelete,
	toggleNode
}: AttributeRowProps) => {
	const isRootLevel = attr.level === 0 || attr.parentid === null;
	const hasChildren = attr.children && attr.children.length > 0;
	const shouldShowExpandButton =
		isRootLevel && (attr.children_loaded === false || hasChildren);

	const definitelyNoChildren =
		isRootLevel && attr.children_loaded === true && !hasChildren;

	const indentStyle = { paddingLeft: `${(attr.level || 0) * 32 + 16}px` };

	const handleCheckboxChange = (checked: boolean) => {
		const collectAllIds = (node: Attribute): number[] => {
			const ids = [node.id];
			if (node.children) {
				node.children.forEach((child) => {
					ids.push(...collectAllIds(child));
				});
			}
			return ids;
		};

		if (checked) {
			const newIds = collectAllIds(attr);
			setSelectedIds((prev: number[]) => {
				const existingIds = newIds.filter((id) => !prev.includes(id));
				return [...prev, ...existingIds];
			});
		} else {
			const idsToRemove = collectAllIds(attr);
			setSelectedIds((prev: number[]) =>
				prev.filter((id) => !idsToRemove.includes(id))
			);
		}
	};

	const isChecked = selectedIds.includes(attr.id);
	const hasSomeChildrenSelected = attr.children?.some(
		(child) =>
			selectedIds.includes(child.id) ||
			child.children?.some((grandChild) => selectedIds.includes(grandChild.id))
	);

	return (
		<>
			<TableRow
				key={attr.id}
				className={attr.level && attr.level > 0 ? "bg-gray-50/50" : ""}
			>
				<TableCell>
					<Checkbox
						checked={isChecked || hasSomeChildrenSelected}
						onCheckedChange={handleCheckboxChange}
					/>
				</TableCell>
				<TableCell className="font-mono text-sm">{attr.id}</TableCell>
				<TableCell>
					<div className="flex items-center gap-2" style={indentStyle}>
						{shouldShowExpandButton ? (
							<button
								onClick={() => toggleNode(attr.id)}
								className="p-1 hover:bg-gray-200 rounded flex items-center justify-center w-6 h-6 border border-gray-300"
								disabled={attr.children_loading}
								title={attr.expanded ? "Thu gọn" : "Mở rộng"}
							>
								{attr.children_loading ? (
									<Loader2 className="w-3 h-3 animate-spin text-blue-500" />
								) : attr.expanded ? (
									<ChevronDown className="w-4 h-4 text-gray-700" />
								) : (
									<ChevronRight className="w-4 h-4 text-gray-700" />
								)}
							</button>
						) : definitelyNoChildren ? (
							<div
								className="w-6 h-6 flex items-center justify-center"
								title="Không có children"
							>
								<span className="text-gray-400">—</span>
							</div>
						) : (
							<div className="w-6" />
						)}

						<div className="flex items-center gap-2">
							{attr.color && (
								<div className="flex flex-row gap-1 items-center">
									<div
										className="w-5 h-5 rounded border"
										style={{ backgroundColor: attr.color }}
										title={attr.color}
									/>
									<span className="text-xs font-mono">{attr.color}</span>
								</div>
							)}
							
							{attr.image && (
								<div className="flex items-center">
									<img
										src={attr.image}
										alt={attr.name}
										className="w-8 h-8 object-cover rounded border border-gray-300"
										title={attr.name}
									/>
								</div>
							)}
							
							<span className={attr.level === 0 ? "font-medium" : "text-sm"}>
								{attr.level && attr.level > 0 ? `↳ ${attr.name}` : attr.name}
							</span>
							{attr.parentid === null && attr.type && (
								<span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
									{attr.type}
								</span>
							)}
						</div>
					</div>
				</TableCell>
				<TableCell>
					{attr.parentid === null ? (
						<span className="font-medium capitalize">{attr.type || "-"}</span>
					) : (
						<span className="text-gray-600">{attr.type || "-"}</span>
					)}
				</TableCell>
				<TableCell className="text-center">{attr.order}</TableCell>
				<TableCell>
					<span
						className={`inline-block px-2 py-1 rounded text-xs font-medium ${
							attr.status === "active"
								? "bg-green-100 text-green-800 border border-green-200"
								: "bg-red-100 text-red-800 border border-red-200"
						}`}
					>
						{attr.status === "active" ? "Hoạt động" : "Ẩn"}
					</span>
				</TableCell>
				<TableCell>
					<div className="flex items-center gap-2">
						<Button
							size="sm"
							variant="outline"
							onClick={() => onEdit(attr)}
							className="h-8 px-3"
						>
							Sửa
						</Button>
						<Button
							size="sm"
							variant="destructive"
							onClick={() => onDelete(attr.id)}
							className="h-8 px-3"
						>
							Xóa
						</Button>
					</div>
				</TableCell>
			</TableRow>

			{attr.expanded &&
				hasChildren &&
				attr.children!.map((child) => (
					<AttributeRow
						key={child.id}
						attr={child}
						selectedIds={selectedIds}
						setSelectedIds={setSelectedIds}
						onEdit={onEdit}
						onDelete={onDelete}
						toggleNode={toggleNode}
					/>
				))}
		</>
	);
};