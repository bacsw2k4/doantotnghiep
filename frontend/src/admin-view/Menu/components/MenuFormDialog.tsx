// src/pages/menus/components/MenuFormDialog.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { type Menu } from "../MenuManagement";
import {
    Globe,
    Hash,
    Type,
    Link2,
    FileText,
    ChevronRight,
    Settings,
    Plus,
    Minus
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/services/api";
import { toast } from "sonner";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formData: Partial<Menu>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<Menu>>>;
    isEditing: boolean;
    selectedLangId: number;
    onSubmit: () => Promise<void>;
    onGetMaxOrder: (parentId: number | null) => Promise<number>;
}

// Hàm flatten chỉ lấy cấp 1 và cấp 2
const flattenMenuForDropdown = (menus: Menu[] = []): Menu[] => {
    const result: Menu[] = [];
    
    menus.forEach(menu => {
        // Thêm menu cấp 1 (không có prefix)
        result.push({
            ...menu,
            name: menu.name,
            level: 0
        });
        
        // Thêm children (cấp 2) nếu có
        if (menu.children && menu.children.length > 0) {
            menu.children.forEach(child => {
                result.push({
                    ...child,
                    name: `— ${child.name}`, // Thêm prefix cho cấp 2
                    level: 1
                });
            });
        }
    });
    
    return result;
};

export const MenuFormDialog = ({
    open,
    onOpenChange,
    formData,
    setFormData,
    isEditing,
    selectedLangId,
    onSubmit,
    onGetMaxOrder
}: Props) => {
    const [loading, setLoading] = useState(false);
    const [dropdownMenus, setDropdownMenus] = useState<Menu[]>([]);
    const [loadingDropdown, setLoadingDropdown] = useState(false);

    // Tải danh sách menu cho dropdown
    useEffect(() => {
        if (open && selectedLangId) {
            loadDropdownMenus();
        } else {
            setDropdownMenus([]);
        }
    }, [open, selectedLangId]);

    const loadDropdownMenus = async () => {
        setLoadingDropdown(true);
        try {
            const params: any = {
                lang_id: selectedLangId
            };
            
            if (isEditing && formData.id) {
                params.exclude_id = formData.id;
            }
            
            const res = await api.get("/menus/dropdown", { params });
            
            if (res.data.success) {
                // Flatten menu (chỉ cấp 1 và cấp 2)
                const flattened = flattenMenuForDropdown(res.data.data);
                setDropdownMenus(flattened);
            }
        } catch (err: any) {
            console.error("Lỗi tải dropdown menus:", err);
            toast.error("Lỗi tải danh sách menu");
        } finally {
            setLoadingDropdown(false);
        }
    };

    // Khi mở dialog, lấy order max nếu là tạo mới
    useEffect(() => {
        if (open && !isEditing) {
            fetchMaxOrder();
        }
    }, [open, isEditing, formData.parentid]);

    const fetchMaxOrder = async () => {
        try {
            const order = await onGetMaxOrder(formData.parentid || null);
            setFormData((prev) => ({ ...prev, order }));
        } catch (err) {
            console.error("Lỗi lấy thứ tự:", err);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name?.trim()) {
            toast.error("Vui lòng nhập tên menu");
            return;
        }

        setLoading(true);
        try {
            const payload: any = {
                name: formData.name.trim(),
                url: formData.url?.trim() || null,
                desc: formData.desc?.trim() || null,
                content: formData.content?.trim() || null,
                seotitle: formData.seotitle?.trim() || null,
                seodesc: formData.seodesc?.trim() || null,
                params: formData.params?.trim() || null,
                order: formData.order || 0,
                status: formData.status || "active",
                lang_id: selectedLangId
            };

            if (formData.parentid) {
                payload.parentid = formData.parentid;
            }

            if (isEditing && formData.id) {
                await api.put(`/menus/${formData.id}`, payload);
                toast.success("Cập nhật menu thành công");
            } else {
                await api.post("/menus", payload);
                toast.success("Tạo menu thành công");
            }

            await onSubmit();
            onOpenChange(false);
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-w-4xl max-h-[95vh] overflow-y-auto">
                <DialogHeader className="border-b">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <ChevronRight className="h-7 w-7 text-primary rotate-90" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold">
                                {isEditing ? "Chỉnh sửa Menu" : "Tạo Menu Mới"}
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Quản lý cấu trúc menu đa cấp (tối đa 3 cấp)
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Dòng 1: Ngôn ngữ + Thứ tự */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                Ngôn ngữ
                            </Label>
                            <div className="h-10 px-3 flex items-center border rounded-md bg-muted/30">
                                <span className="font-medium">Tiếng Việt</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Hash className="w-4 h-4" />
                                Thứ tự hiển thị
                            </Label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        type="number"
                                        min="0"
                                        value={formData.order || 0}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                order: Number(e.target.value) || 0
                                            })
                                        }
                                        className="h-10 pl-9"
                                        disabled={loading}
                                    />
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                </div>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            order: Math.max(0, (prev.order || 0) - 1)
                                        }))
                                    }
                                    disabled={loading}
                                >
                                    <Minus className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            order: (prev.order || 0) + 1
                                        }))
                                    }
                                    disabled={loading}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                                {!isEditing && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={fetchMaxOrder}
                                        disabled={loading}
                                    >
                                        Max
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tên menu */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Type className="w-4 h-4" />
                            Tên menu <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            value={formData.name || ""}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder="Trang chủ, Sản phẩm, Tin tức..."
                            className="text-lg font-medium"
                            disabled={loading}
                        />
                    </div>

                    <div className="flex gap-3">
                        {/* Menu cha */}
                        <div className="space-y-2 flex-1">
                            <Label className="flex items-center gap-2">
                                Menu cha
                            </Label>
                            <Select
                                value={formData.parentid?.toString() || "none"}
                                onValueChange={(v) => {
                                    const newParentId = v === "none" ? null : Number(v);
                                    setFormData({
                                        ...formData,
                                        parentid: newParentId
                                    });
                                    
                                    if (!isEditing) {
                                        setTimeout(() => fetchMaxOrder(), 100);
                                    }
                                }}
                                disabled={loading || loadingDropdown}
                            >
                                <SelectTrigger className="w-full">
                                    {loadingDropdown ? (
                                        <span className="text-muted-foreground">Đang tải...</span>
                                    ) : (
                                        <SelectValue placeholder="Chọn menu cha..." />
                                    )}
                                </SelectTrigger>
                                <SelectContent className="max-h-64">
                                    <SelectItem value="none">
                                        <span className="font-medium">Không có menu cha (cấp 1)</span>
                                    </SelectItem>
                                    {dropdownMenus.map((menu) => (
                                        <SelectItem key={menu.id} value={menu.id.toString()}>
                                            {menu.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                                * Chỉ hiển thị menu cấp 1 và cấp 2
                            </p>
                        </div>

                        {/* Trạng thái */}
                        <div className="space-y-2 flex-1">
                            <Label className="flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Trạng thái
                            </Label>
                            <Select
                                value={formData.status || "active"}
                                onValueChange={(v) =>
                                    setFormData({
                                        ...formData,
                                        status: v as "active" | "inactive"
                                    })
                                }
                                disabled={loading}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Hoạt động</SelectItem>
                                    <SelectItem value="inactive">Ẩn</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* URL */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Link2 className="w-4 h-4" />
                            URL (liên kết)
                        </Label>
                        <Input
                            placeholder="/gioi-thieu, https://example.com, /san-pham"
                            value={formData.url || ""}
                            onChange={(e) =>
                                setFormData({ ...formData, url: e.target.value || null })
                            }
                            disabled={loading}
                        />
                    </div>

                    {/* Mô tả ngắn */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Mô tả ngắn
                        </Label>
                        <Textarea
                            rows={3}
                            placeholder="Mô tả ngắn gọn về menu này (hiển thị trong hover hoặc SEO)..."
                            value={formData.desc || ""}
                            onChange={(e) =>
                                setFormData({ ...formData, desc: e.target.value || null })
                            }
                            disabled={loading}
                        />
                    </div>

                    {/* SEO Fields (tùy chọn) */}
                    <div className="space-y-2">
                        <Label>
                            SEO Title
                        </Label>
                        <Input
                            placeholder="Tiêu đề SEO..."
                            value={formData.seotitle || ""}
                            onChange={(e) =>
                                setFormData({ ...formData, seotitle: e.target.value || null })
                            }
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>
                            SEO Description
                        </Label>
                        <Textarea
                            rows={2}
                            placeholder="Mô tả SEO..."
                            value={formData.seodesc || ""}
                            onChange={(e) =>
                                setFormData({ ...formData, seodesc: e.target.value || null })
                            }
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center border-t px-6 py-4 bg-muted/30">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            <span className="text-destructive">*</span> Trường bắt buộc
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Tạo menu mới sẽ có cấp = cấp menu cha + 1
                        </p>
                    </div>
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
                            disabled={!formData.name?.trim() || loading}
                        >
                            {loading ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo Menu"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};