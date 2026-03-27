// src/pages/users/components/UserTable.tsx
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { UserRow } from "./UserRow";
import { useRef, useEffect } from "react";

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

interface UserTableProps {
	users: User[];
	selectedIds: number[];
	setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
	onEdit: (user: User) => void;
	onDelete: (id: number) => void;
}

export const UserTable = ({
	users,
	selectedIds,
	setSelectedIds,
	onEdit,
	onDelete
}: UserTableProps) => {
	const selectAllRef = useRef<HTMLButtonElement & { indeterminate?: boolean }>(
		null
	);

	const isAllChecked = users.length > 0 && selectedIds.length === users.length;
	const isIndeterminate =
		selectedIds.length > 0 && selectedIds.length < users.length;

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
										setSelectedIds(checked ? users.map((u) => u.id) : []);
									}}
								/>
							</TableHead>
							<TableHead className="w-16">ID</TableHead>
							<TableHead className="w-20">Ảnh</TableHead>
							<TableHead>Họ tên</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>SĐT</TableHead>
							<TableHead>Role</TableHead>
							<TableHead className="w-28">Trạng thái</TableHead>
							<TableHead className="w-32">Hành động</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{users.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={9}
									className="h-24 text-center text-gray-500"
								>
									Không có dữ liệu
								</TableCell>
							</TableRow>
						) : (
							users.map((user) => (
								<UserRow
									key={user.id}
									user={user}
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