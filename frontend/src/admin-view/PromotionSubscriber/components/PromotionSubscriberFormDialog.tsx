import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Mail, Check, X } from "lucide-react";
import { useState } from "react";
import type { PromotionSubscriber } from "../PromotionSubscriberManagement";
import { toast } from "react-toastify";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<PromotionSubscriber>;
  setFormData: (data: Partial<PromotionSubscriber>) => void;
  isEditing: boolean;
  onSubmit: (formData: FormData) => Promise<void>;
}

export const PromotionSubscriberFormDialog = ({
  open,
  onOpenChange,
  formData,
  setFormData,
  isEditing,
  onSubmit,
}: Props) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.email?.trim()) {
      toast.error("Email là bắt buộc");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Email không hợp lệ");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("email", formData.email || "");
      fd.append("status", formData.status || "active");

      await onSubmit(fd);
      toast.success(
        isEditing
          ? "Cập nhật người đăng ký thành công"
          : "Thêm người đăng ký thành công"
      );
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">
                {isEditing
                  ? "Chỉnh sửa Người đăng ký"
                  : "Thêm Người đăng ký Mới"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Quản lý thông tin người đăng ký nhận khuyến mãi
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-8">
          <div className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="Nhập email người đăng ký..."
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="h-11 text-lg font-medium"
                />
                <p className="text-sm text-muted-foreground">
                  Ví dụ: user@example.com
                </p>
              </div>
            </div>
          </div>

          {/* === TRẠNG THÁI === */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Trạng thái đăng ký</Label>
              <Select
                value={formData.status || "active"}
                onValueChange={(v: "active" | "inactive") =>
                  setFormData({ ...formData, status: v })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Hoạt động
                  </SelectItem>
                  <SelectItem value="inactive" className="flex items-center gap-2">
                    <X className="h-4 w-4 text-red-600" />
                    Không hoạt động
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* === FOOTER === */}
        <div className="flex justify-between items-center border-t px-6 py-4 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            <span className="text-destructive">*</span> Trường bắt buộc
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !formData.email?.trim()}
            >
              {loading
                ? "Đang lưu..."
                : isEditing
                ? "Cập nhật"
                : "Thêm mới"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};