import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { type Attribute } from "@/hooks/useAttributes";
import { AttributeRow } from "./AttributeRow";
import { useRef, useEffect } from "react";

interface Props {
  attributes: Attribute[];
  flattened: Attribute[];
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  onEdit: (attr: Attribute) => void;
  onDelete: (id: number) => void;
  toggleNode: (id: number) => void;
}

export const AttributeTable = ({
  attributes,
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
                  onCheckedChange={(checked) => {
                    setSelectedIds(checked ? flattened.map((a) => a.id) : []);
                  }}
                />
              </TableHead>
              <TableHead className="w-16">ID</TableHead>
              <TableHead className="pr-5">Tên</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead className="w-20">Thứ tự</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead className="w-40">Hành động</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {attributes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                  {selectedIds.length > 0 ? 
                    "Đang tải dữ liệu..." : 
                    "Không có dữ liệu"
                  }
                </TableCell>
              </TableRow>
            ) : (
              attributes.map((attr) => (
                <AttributeRow
                  key={attr.id}
                  attr={attr}
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