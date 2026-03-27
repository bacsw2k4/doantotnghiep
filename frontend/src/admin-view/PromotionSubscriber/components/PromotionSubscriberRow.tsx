import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Mail, Check, X, Send } from "lucide-react";
import type { PromotionSubscriber } from "../PromotionSubscriberManagement";

interface PromotionSubscriberRowProps {
  subscriber: PromotionSubscriber;
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  onEdit: (subscriber: PromotionSubscriber) => void;
  onDelete: (id: number) => void;
  onSendEmail: (subscriber: PromotionSubscriber) => void;
}

export const PromotionSubscriberRow = ({
  subscriber,
  selectedIds,
  setSelectedIds,
  onEdit,
  onDelete,
  onSendEmail,
}: PromotionSubscriberRowProps) => {
  const isSelected = selectedIds.includes(subscriber.id);

  const handleCheckboxChange = (checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, subscriber.id] : prev.filter((id) => id !== subscriber.id)
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <TableRow key={subscriber.id} className={isSelected ? "bg-muted/50" : ""}>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
        />
      </TableCell>
      <TableCell className="font-mono text-sm">{subscriber.id}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{subscriber.email}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={subscriber.status === "active" ? "default" : "secondary"}
          className="flex items-center gap-1 px-3 py-1"
        >
          {subscriber.status === "active" ? (
            <>
              <Check className="w-3 h-3" />
              Hoạt động
            </>
          ) : (
            <>
              <X className="w-3 h-3" />
              Không hoạt động
            </>
          )}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="text-sm text-gray-600">
          {formatDate(subscriber.subscribed_at)}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-gray-600">
          {formatDate(subscriber.created_at)}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(subscriber)}
            title="Chỉnh sửa"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSendEmail(subscriber)}
            title="Gửi email khuyến mãi"
          >
            <Send className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(subscriber.id)}
            title="Xóa"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};