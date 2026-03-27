import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Mail, Send } from "lucide-react";
import { toast } from "react-toastify";

interface PromotionSubscriberEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  recipientEmail?: string;
  onSubmit: (data: { subject: string; content: string; ids?: number[] }) => Promise<void>;
  selectedIds?: number[];
  isSingle?: boolean;
}

export const PromotionSubscriberEmailDialog = ({
  open,
  onOpenChange,
  selectedCount,
  recipientEmail,
  onSubmit,
  selectedIds = [],
  isSingle = false,
}: PromotionSubscriberEmailDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    content: "",
  });

  const handleSubmit = async () => {
    if (!formData.subject.trim()) {
      toast.error("Tiêu đề email là bắt buộc");
      return;
    }
    
    if (!formData.content.trim()) {
      toast.error("Nội dung email là bắt buộc");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        subject: formData.subject,
        content: formData.content,
        ids: isSingle ? undefined : (selectedIds.length > 0 ? selectedIds : undefined)
      });
      
      toast.success(
        isSingle 
          ? `Đã gửi email đến ${recipientEmail}`
          : `Đã gửi email đến ${selectedCount} người đăng ký`
      );
      
      setFormData({ subject: "", content: "" });
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra khi gửi email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Send className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">
                Gửi Email Khuyến Mãi
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {isSingle ? (
                  <>Gửi email đến: <span className="font-semibold">{recipientEmail}</span></>
                ) : (
                  <>Gửi email đến <span className="font-semibold">{selectedCount}</span> người đăng ký</>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">
              Tiêu đề email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              placeholder="Nhập tiêu đề email..."
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">
              Nội dung email <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              placeholder="Nhập nội dung email khuyến mãi..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="min-h-[200px] resize-none"
              rows={10}
            />
            <p className="text-sm text-muted-foreground">
              Hỗ trợ HTML. Nội dung sẽ được hiển thị trong template email chuyên nghiệp.
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Thông tin gửi email
            </h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Email sẽ được gửi đến tất cả người đăng ký có trạng thái "Hoạt động"</p>
              <p>• Hệ thống tự động thêm header và footer chuyên nghiệp</p>
              <p>• Người nhận có thể hủy đăng ký bất kỳ lúc nào</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full items-center">
            <p className="text-sm text-muted-foreground">
              <span className="text-destructive">*</span> Trường bắt buộc
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({ subject: "", content: "" });
                  onOpenChange(false);
                }}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.subject.trim() || !formData.content.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Gửi Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};