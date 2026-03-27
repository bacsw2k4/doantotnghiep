// src/pages/roles/components/RoleRow.tsx
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";

interface Role {
	id: number;
	name: string;
	description: string;
	created_at?: string;
	updated_at?: string;
}

interface RoleRowProps {
	role: Role;
	selectedIds: number[];
	setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
	onEdit: (role: Role) => void;
	onDelete: (id: number) => void;
}

export const RoleRow = ({
	role,
	selectedIds,
	setSelectedIds,
	onEdit,
	onDelete
}: RoleRowProps) => {
	const isSelected = selectedIds.includes(role.id);

	const handleCheckboxChange = (checked: boolean) => {
		setSelectedIds((prev) =>
			checked ? [...prev, role.id] : prev.filter((id) => id !== role.id)
		);
	};

	return (
		<TableRow key={role.id} className={isSelected ? "bg-muted/50" : ""}>
			<TableCell>
				<Checkbox checked={isSelected} onCheckedChange={handleCheckboxChange} />
			</TableCell>
			<TableCell className="font-mono text-sm">{role.id}</TableCell>
			<TableCell className="font-medium">{role.name}</TableCell>
			<TableCell className="max-w-xs">
				<div className="truncate">{role.description || "-"}</div>
			</TableCell>
			<TableCell>
				<div className="flex items-center gap-1">
					<Button
						size="sm"
						variant="outline"
						onClick={() => onEdit(role)}
						className="h-8 w-8 p-0"
					>
						<Edit className="h-4 w-4" />
					</Button>
					<Button
						size="sm"
						variant="destructive"
						onClick={() => onDelete(role.id)}
						className="h-8 w-8 p-0"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</TableCell>
		</TableRow>
	);
};