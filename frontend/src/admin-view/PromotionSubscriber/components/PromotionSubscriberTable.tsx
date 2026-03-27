import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useRef, useEffect } from "react";
import type { PromotionSubscriber } from "../PromotionSubscriberManagement";
import { PromotionSubscriberRow } from "./PromotionSubscriberRow";

interface PromotionSubscriberTableProps {
  subscribers: PromotionSubscriber[];
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  onEdit: (subscriber: PromotionSubscriber) => void;
  onDelete: (id: number) => void;
  onSendEmail: (subscriber: PromotionSubscriber) => void;
}

export const PromotionSubscriberTable = ({
  subscribers,
  selectedIds,
  setSelectedIds,
  onEdit,
  onDelete,
  onSendEmail,
}: PromotionSubscriberTableProps) => {
  const selectAllRef = useRef<HTMLButtonElement & { indeterminate?: boolean }>(
    null
  );

  const isAllChecked = subscribers.length > 0 && selectedIds.length === subscribers.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < subscribers.length;

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
                    setSelectedIds(checked ? subscribers.map((s) => s.id) : []);
                  }}
                />
              </TableHead>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead className="w-40">Ngày đăng ký</TableHead>
              <TableHead className="w-40">Ngày tạo</TableHead>
              <TableHead className="w-40">Hành động</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {subscribers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              subscribers.map((subscriber) => (
                <PromotionSubscriberRow
                  key={subscriber.id}
                  subscriber={subscriber}
                  selectedIds={selectedIds}
                  setSelectedIds={setSelectedIds}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onSendEmail={onSendEmail}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};