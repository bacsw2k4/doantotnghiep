// src/pages/vouchers/components/VoucherFormDialog.tsx
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
} from "@/components/ui/dialog";
import {
  Tag,
  Upload,
  Trash2,
  Sparkles,
  Percent,
  DollarSign,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: {
    id: number;
    code: string;
    name: string;
    image: File | string | null;
    type: "percentage" | "fixed";
    discount: number;
    minmoney: number | null;
    status: "active" | "inactive";
    enddate: string | null;
  };
  setFormData: (data: any) => void;
  isEditing: boolean;
  onSubmit: (formData: FormData) => Promise<void>;
}

export const VoucherFormDialog = ({
  open,
  onOpenChange,
  formData,
  setFormData,
  isEditing,
  onSubmit,
}: Props) => {
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format date cho input type="date"
  const formatDateForInput = (dateString: string | null): string => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  // Get current date in YYYY-MM-DD format for min date
  const getTodayDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Xử lý image preview
  useEffect(() => {
    if (!open) return;

    if (isEditing) {
      if (formData.image) {
        if (typeof formData.image === "string") {
          setImagePreview(formData.image);
        } else if (formData.image instanceof File) {
          const url = URL.createObjectURL(formData.image);
          setImagePreview(url);

          return () => {
            URL.revokeObjectURL(url);
          };
        }
      } else {
        setImagePreview("");
      }
    } else {
      if (formData.image instanceof File) {
        const url = URL.createObjectURL(formData.image);
        setImagePreview(url);

        return () => {
          URL.revokeObjectURL(url);
        };
      } else {
        setImagePreview("");
      }
    }
  }, [open, isEditing, formData.image]);

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh hợp lệ");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được quá 5MB");
      return;
    }

    setFormData({ ...formData, image: file });
    if (e.target) e.target.value = "";
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview("");
  };

  const handleSubmit = async () => {
    if (!formData.code?.trim()) {
      toast.error("Vui lòng nhập mã voucher");
      return;
    }
    if (!formData.name?.trim()) {
      toast.error("Vui lòng nhập tên voucher");
      return;
    }
    if (!formData.discount || formData.discount <= 0) {
      toast.error("Vui lòng nhập giá trị giảm giá hợp lệ");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();

      fd.append("code", formData.code || "");
      fd.append("name", formData.name || "");
      fd.append("type", formData.type || "percentage");
      fd.append("discount", formData.discount?.toString() || "0");
      fd.append("status", formData.status || "active");

      if (formData.minmoney) {
        fd.append("minmoney", formData.minmoney.toString());
      }
      
      // Xử lý enddate
      if (formData.enddate && formData.enddate.trim() !== "") {
        fd.append("enddate", formData.enddate);
      }

      // Chỉ append image nếu nó là File (ảnh mới chọn)
      if (formData.image instanceof File) {
        fd.append("image", formData.image);
      }
      // Nếu đang edit và image là null (người dùng đã xóa ảnh)
      else if (isEditing && formData.image === null) {
        fd.append("remove_image", "1");
      }

      await onSubmit(fd);
      toast.success(
        isEditing ? "Cập nhật voucher thành công" : "Tạo voucher thành công"
      );
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const getDisplayImage = () => {
    if (imagePreview) {
      return imagePreview;
    }

    if (typeof formData.image === "string" && formData.image) {
      return formData.image;
    }

    return "";
  };

  const displayImage = getDisplayImage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-3xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">
                {isEditing ? "Chỉnh sửa Voucher" : "Tạo Voucher Mới"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Quản lý thông tin voucher trong hệ thống
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-8">
          {/* === THÔNG TIN VOUCHER === */}
          <div className="space-y-5">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Thông tin voucher
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Mã voucher <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Nhập mã voucher..."
                  value={formData.code || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Tên voucher <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Nhập tên voucher..."
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Loại voucher <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.type || "percentage"}
                  onValueChange={(v) =>
                    setFormData({ ...formData, type: v as "percentage" | "fixed" })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn loại voucher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Phần trăm (%)
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Cố định (VND)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Giá trị giảm <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="Nhập giá trị giảm..."
                  value={formData.discount || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, discount: Number(e.target.value) })
                  }
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Đơn tối thiểu
                </Label>
                <Input
                  type="number"
                  placeholder="Nhập đơn tối thiểu..."
                  value={formData.minmoney || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minmoney: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Để trống nếu không có yêu cầu
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ngày hết hạn
                </Label>
                <Input
                  type="date"
                  value={formatDateForInput(formData.enddate)}
                  min={getTodayDate()} // Không cho chọn ngày trong quá khứ
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      enddate: e.target.value || null,
                    })
                  }
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Để trống nếu không có hạn sử dụng
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={formData.status || "active"}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    status: v as "active" | "inactive",
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* === ẢNH VOUCHER === */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Hình ảnh voucher
            </h3>

            {displayImage ? (
              <div className="flex items-center gap-6">
                <div className="relative">
                  <img
                    src={displayImage}
                    alt="Voucher image preview"
                    className="w-32 h-32 rounded-lg object-cover border-2 border-muted"
                  />
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 rounded-full"
                      onClick={handleOpenFilePicker}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8 rounded-full"
                      onClick={handleRemoveImage}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Click vào biểu tượng để thay đổi hoặc xóa ảnh voucher
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, WebP • Tối đa 5MB
                  </p>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="relative w-full h-32 border-2 border-dashed hover:border-primary/50"
                onClick={handleOpenFilePicker}
                type="button"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Click để tải lên ảnh voucher</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      JPG, PNG, WebP • Tối đa 5MB
                    </p>
                  </div>
                </div>
              </Button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
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
              disabled={
                loading ||
                !formData.code?.trim() ||
                !formData.name?.trim() ||
                !formData.discount ||
                formData.discount <= 0
              }
            >
              {loading ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo Voucher"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};