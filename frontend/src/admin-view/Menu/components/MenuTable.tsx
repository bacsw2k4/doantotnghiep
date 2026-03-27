// src/pages/menus/components/MenuTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { MenuRow } from "./MenuRow";
import { type Menu } from "../MenuManagement"; 
import { useRef, useEffect } from "react";

interface Props {
  menus: Menu[];
  flattened: Menu[];
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  onEdit: (menu: Menu) => void;
  onDelete: (id: number) => void;
  toggleNode: (id: number) => void;
}

export const MenuTable = ({
  menus,
  flattened,
  selectedIds,
  setSelectedIds,
  onEdit,
  onDelete,
  toggleNode,
}: Props) => {
  const selectAllRef = useRef<HTMLButtonElement & { indeterminate?: boolean }>(null);

  const isAllChecked = flattened.length > 0 && selectedIds.length === flattened.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < flattened.length;

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
                  onCheckedChange={(checked) =>
                    setSelectedIds(checked ? flattened.map((m) => m.id) : [])
                  }
                />
              </TableHead>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Tên Menu</TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="w-20 text-center">Thứ tự</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead className="w-40">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menus.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              menus.map((menu) => (
                <MenuRow
                  key={menu.id}
                  menu={menu}
                  selectedIds={selectedIds}
                  setSelectedIds={setSelectedIds}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  toggleNode={toggleNode}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};