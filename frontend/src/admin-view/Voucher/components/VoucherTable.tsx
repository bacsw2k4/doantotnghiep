// src/pages/vouchers/components/VoucherTable.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { VoucherRow } from "./VoucherRow";
import { useRef, useEffect } from "react";

interface Voucher {
  id: number;
  code: string;
  name: string;
  image: string | File | null;
  type: "percentage" | "fixed";
  discount: number;
  minmoney: number | null;
  status: "active" | "inactive";
  createdate: string;
  updatedate: string;
  enddate: string | null;
}

interface VoucherTableProps {
  vouchers: Voucher[];
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  onEdit: (voucher: Voucher) => void;
  onDelete: (id: number) => void;
}

export const VoucherTable = ({
  vouchers,
  selectedIds,
  setSelectedIds,
  onEdit,
  onDelete,
}: VoucherTableProps) => {
  const selectAllRef = useRef<HTMLButtonElement & { indeterminate?: boolean }>(
    null
  );

  const isAllChecked = vouchers.length > 0 && selectedIds.length === vouchers.length;
  const isIndeterminate =
    selectedIds.length > 0 && selectedIds.length < vouchers.length;

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
                    setSelectedIds(checked ? vouchers.map((v) => v.id) : []);
                  }}
                />
              </TableHead>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Mã</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead className="w-24">Hình ảnh</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Giảm giá</TableHead>
              <TableHead>Đơn tối thiểu</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead>Ngày hết hạn</TableHead>
              <TableHead className="w-32">Hành động</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {vouchers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="h-24 text-center text-gray-500"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              vouchers.map((voucher) => (
                <VoucherRow
                  key={voucher.id}
                  voucher={voucher}
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