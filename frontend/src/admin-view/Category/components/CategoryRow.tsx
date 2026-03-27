import { Button } from "@/components/ui/button"; 
import { Checkbox } from "@/components/ui/checkbox"; 
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import type { Category } from "../CategoryManagement";

interface CategoryRowProps {
	category: Category;
	level: number;
	selectedIds: number[];
	setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
	allAttributes: any[];
	onEdit: (category: Category) => void;
	onDelete: (id: number) => void;
}

export const CategoryRow = ({
	category,
	level,
	selectedIds,
	setSelectedIds,
	allAttributes,
	onEdit,
	onDelete
}: CategoryRowProps) => {
	const isSelected = selectedIds.includes(category.id);

	const handleCheckboxChange = (checked: boolean) => {
		setSelectedIds((prev) =>
			checked ? [...prev, category.id] : prev.filter((id) => id !== category.id)
		);
	};

	return (
		<>
			<TableRow key={category.id} className={isSelected ? "bg-muted/50" : ""}>
				<TableCell>
					<Checkbox
						checked={isSelected}
						onCheckedChange={handleCheckboxChange}
					/>
				</TableCell>
				<TableCell className="font-mono text-sm">{category.id}</TableCell>
				<TableCell style={{ paddingLeft: `${level * 20}px` }}>
					{level > 0 && <span className="text-gray-500 mr-2">↳</span>}
					<span className="font-medium">{category.name}</span>
				</TableCell>
				<TableCell>
					{category.image && typeof category.image === "string" ? (
						<img
							src={`http://localhost:8000${category.image}`}
							alt={category.name}
							className="h-10 w-10 object-cover rounded border"
						/>
					) : (
						<span className="text-gray-400">-</span>
					)}
				</TableCell>
				<TableCell>
					{category.attribute ? (
						<div className="flex flex-wrap gap-1 w-full">
							{category.attribute.split(",").map((attrIdStr, i) => {
								const attrId = Number(attrIdStr.trim());
								const attr = allAttributes.find((a) => a.id === attrId);
								return attr ? (
									<Badge key={i} variant="outline" className="text-xs">
										{attr.name}
									</Badge>
								) : null;
							})}
						</div>
					) : (
						"-"
					)}
				</TableCell>
				<TableCell className="text-center">{category.order}</TableCell>
				<TableCell>
					<span
						className={`px-2 py-1 rounded text-xs font-medium ${
							category.status === "active"
								? "bg-green-100 text-green-800"
								: "bg-red-100 text-red-800"
						}`}
					>
						{category.status === "active" ? "Hoạt động" : "Ẩn"}
					</span>
				</TableCell>
				<TableCell>
					<div className="flex items-center gap-1">
						<Button
							size="sm"
							variant="outline"
							onClick={() => onEdit(category)}
						>
							<Edit className="w-4 h-4" />
						</Button>
						<Button
							size="sm"
							variant="destructive"
							onClick={() => onDelete(category.id)}
						>
							<Trash2 className="w-4 h-4" />
						</Button>
					</div>
				</TableCell>
			</TableRow>
		</>
	);
};