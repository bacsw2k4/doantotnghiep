// src/pages/roles/components/RoleTable.tsx
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { RoleRow } from "./RoleRow";
import { useRef, useEffect } from "react";

interface Role {
	id: number;
	name: string;
	description: string;
	created_at?: string;
	updated_at?: string;
}

interface RoleTableProps {
	roles: Role[];
	selectedIds: number[];
	setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
	onEdit: (role: Role) => void;
	onDelete: (id: number) => void;
}

export const RoleTable = ({
	roles,
	selectedIds,
	setSelectedIds,
	onEdit,
	onDelete
}: RoleTableProps) => {
	const selectAllRef = useRef<HTMLButtonElement & { indeterminate?: boolean }>(
		null
	);

	const isAllChecked = roles.length > 0 && selectedIds.length === roles.length;
	const isIndeterminate =
		selectedIds.length > 0 && selectedIds.length < roles.length;

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
										setSelectedIds(checked ? roles.map((r) => r.id) : []);
									}}
								/>
							</TableHead>
							<TableHead className="w-16">ID</TableHead>
							<TableHead>Tên Role</TableHead>
							<TableHead>Mô tả</TableHead>
							<TableHead className="w-32">Hành động</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{roles.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="h-24 text-center text-gray-500"
								>
									Không có dữ liệu
								</TableCell>
							</TableRow>
						) : (
							roles.map((role) => (
								<RoleRow
									key={role.id}
									role={role}
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