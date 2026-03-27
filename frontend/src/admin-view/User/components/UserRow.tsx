// src/pages/users/components/UserRow.tsx
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { Trash2, Edit } from "lucide-react";

interface User {
	id: number;
	firstname: string;
	lastname: string;
	email: string;
	phone: string;
	address: string;
	avatar?: string;
	role: { id: number; name: string };
	status: "active" | "inactive";
}

interface UserRowProps {
	user: User;
	selectedIds: number[];
	setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
	onEdit: (user: User) => void;
	onDelete: (id: number) => void;
}

export const UserRow = ({
	user,
	selectedIds,
	setSelectedIds,
	onEdit,
	onDelete
}: UserRowProps) => {
	const isSelected = selectedIds.includes(user.id);

	const handleCheckboxChange = (checked: boolean) => {
		setSelectedIds((prev) =>
			checked ? [...prev, user.id] : prev.filter((id) => id !== user.id)
		);
	};

	return (
		<TableRow key={user.id} className={isSelected ? "bg-muted/50" : ""}>
			<TableCell>
				<Checkbox checked={isSelected} onCheckedChange={handleCheckboxChange} />
			</TableCell>
			<TableCell className="font-mono text-sm">{user.id}</TableCell>
			<TableCell>
				{user.avatar ? (
					<img
						src={user.avatar}
						alt={`${user.firstname} avatar`}
						className="w-10 h-10 rounded-full object-cover border"
					/>
				) : (
					<div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
						{user.firstname.charAt(0).toUpperCase()}
					</div>
				)}
			</TableCell>
			<TableCell className="font-medium">
				{user.firstname} {user.lastname}
			</TableCell>
			<TableCell className="max-w-xs truncate">{user.email}</TableCell>
			<TableCell>{user.phone || "-"}</TableCell>
			<TableCell>
				<span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
					{user.role?.name || "-"}
				</span>
			</TableCell>
			<TableCell>
				<span
					className={`px-2 py-1 rounded text-xs font-medium ${
						user.status === "active"
							? "bg-green-100 text-green-800"
							: "bg-red-100 text-red-800"
					}`}
				>
					{user.status === "active" ? "Hoạt động" : "Ngừng"}
				</span>
			</TableCell>
			<TableCell>
				<div className="flex items-center gap-1">
					<Button
						size="sm"
						variant="outline"
						onClick={() => onEdit(user)}
						className="h-8 w-8 p-0"
					>
						<Edit className="h-4 w-4" />
					</Button>
					<Button
						size="sm"
						variant="destructive"
						onClick={() => onDelete(user.id)}
						className="h-8 w-8 p-0"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</TableCell>
		</TableRow>
	);
};