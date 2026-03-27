// src/pages/vouchers/components/VoucherRow.tsx
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { Trash2, Edit } from "lucide-react";

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

interface VoucherRowProps {
  voucher: Voucher;
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  onEdit: (voucher: Voucher) => void;
  onDelete: (id: number) => void;
}

export const VoucherRow = ({
  voucher,
  selectedIds,
  setSelectedIds,
  onEdit,
  onDelete,
}: VoucherRowProps) => {
  const isSelected = selectedIds.includes(voucher.id);

  const handleCheckboxChange = (checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, voucher.id] : prev.filter((id) => id !== voucher.id)
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("vi-VN");
  };

  return (
    <TableRow key={voucher.id} className={isSelected ? "bg-muted/50" : ""}>
      <TableCell>
        <Checkbox checked={isSelected} onCheckedChange={handleCheckboxChange} />
      </TableCell>
      <TableCell className="font-mono text-sm">{voucher.id}</TableCell>
      <TableCell className="font-medium">{voucher.code}</TableCell>
      <TableCell className="font-medium">{voucher.name}</TableCell>
      <TableCell>
        {voucher.image ? (
          <img
            src={typeof voucher.image === "string" ? voucher.image : ""}
            alt={`${voucher.name} image`}
            className="w-10 h-10 rounded object-cover border"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </TableCell>
      <TableCell>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            voucher.type === "percentage"
              ? "bg-purple-100 text-purple-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {voucher.type === "percentage" ? "Phần trăm" : "Cố định"}
        </span>
      </TableCell>
      <TableCell>
        {voucher.discount} {voucher.type === "percentage" ? "%" : "VND"}
      </TableCell>
      <TableCell>{voucher.minmoney ? `${voucher.minmoney} VND` : "-"}</TableCell>
      <TableCell>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            voucher.status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {voucher.status === "active" ? "Hoạt động" : "Ngừng"}
        </span>
      </TableCell>
      <TableCell>{formatDate(voucher.enddate)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(voucher)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(voucher.id)}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};