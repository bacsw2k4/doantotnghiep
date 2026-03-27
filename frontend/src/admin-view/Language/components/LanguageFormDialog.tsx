import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Upload, Trash2, Globe, Hash, FileText, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { Language } from "../LanguageManagement";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<Language>;
  setFormData: (data: Partial<Language>) => void;
  isEditing: boolean;
  onSubmit: (fd: FormData) => Promise<void>;
}

export const LanguageFormDialog = ({
  open,
  onOpenChange,
  formData,
  setFormData,
  isEditing,
  onSubmit,
}: Props) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (formData.image) {
        setImagePreview(`http://localhost:8000${formData.image}`);
      } else {
        setImagePreview("");
      }
      setImageFile(null);
    }
  }, [open, formData.image]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return toast.error("Chỉ chấp nhận file ảnh");
    if (file.size > 2 * 1024 * 1024) return toast.error("Ảnh tối đa 2MB");

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData({ ...formData, image: "" }); // gửi rỗng = xóa ảnh
  };

  const handleSubmit = async () => {
    if (!formData.name?.trim()) {
      toast.error("Tên ngôn ngữ là bắt buộc");
      return;
    }

    const fd = new FormData();
    fd.append("name", formData.name.trim());
    fd.append("desc", formData.desc || "");
    fd.append("order", String(formData.order || 0));
    fd.append("status", formData.status || "active");

    if (imageFile) fd.append("image", imageFile);
    fd.append("image_url", formData.image || ""); // quan trọng!

    await onSubmit(fd);
  };

  const displayImage = imagePreview || (formData.image ? `http://localhost:8000${formData.image}` : "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold">
              {isEditing ? "Chỉnh sửa Ngôn ngữ" : "Thêm Ngôn ngữ Mới"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Tên ngôn ngữ <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tiếng Việt"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Thứ tự hiển thị
              </Label>
              <Input
                type="number"
                value={formData.order || 0}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Mô tả
            </Label>
            <Textarea
              value={formData.desc || ""}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              rows={3}
              placeholder="Mô tả ngắn về ngôn ngữ này..."
            />
          </div>

          <div className="space-y-3">
            <Label>Hình ảnh (cờ)</Label>
            {displayImage ? (
              <div className="relative inline-block group">
                <img
                  src={displayImage}
                  alt="flag"
                  className="h-32 w-48 object-cover rounded-lg border-2"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                  onClick={handleRemoveImage}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-48 h-32 border-2 border-dashed"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10" />
                <span className="mt-2 block">Tải lên ảnh</span>
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-2">
            <Label>Trạng thái</Label>
            <Select
              value={formData.status || "active"}
              onValueChange={(v) => setFormData({ ...formData, status: v as any })}
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Ẩn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? "Cập nhật" : "Tạo mới"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};