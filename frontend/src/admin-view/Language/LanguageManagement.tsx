"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { LanguageTable } from "./components/LanguageTable";
import { LanguageFormDialog } from "./components/LanguageFormDialog";
import api from "@/services/api";

export interface Language {
  id: number;
  name: string;
  image: string | null;
  desc: string | null;
  order: number;
  status: "active" | "inactive";
}

const LanguageManagement = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [filteredLanguages, setFilteredLanguages] = useState<Language[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [showDialog, setShowDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Language>>({
    id: 0,
    name: "",
    image: "",
    desc: "",
    order: 0,
    status: "active",
  });

  const fetchLanguages = async () => {
    setLoading(true);
    try {
      const res = await api.get("/languages");
      const data = res.data.data || [];
      setLanguages(data);
      setFilteredLanguages(data);
    } catch {
      toast.error("Không thể tải danh sách ngôn ngữ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredLanguages(languages);
      return;
    }
    const lower = search.toLowerCase();
    setFilteredLanguages(
      languages.filter(
        (lang) =>
          lang.name.toLowerCase().includes(lower) ||
          lang.desc?.toLowerCase().includes(lower)
      )
    );
  }, [search, languages]);

  const openAddDialog = () => {
    setIsEditing(false);
    setFormData({
      id: 0,
      name: "",
      image: "",
      desc: "",
      order: languages.length + 1,
      status: "active",
    });
    setShowDialog(true);
  };

  const openEditDialog = (lang: Language) => {
    setIsEditing(true);
    setFormData({ ...lang });
    setShowDialog(true);
  };

  const handleSave = async (fd: FormData) => {
    try {
      if (isEditing && formData.id) {
        fd.append("_method", "PUT");
        await api.post(`/languages/${formData.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Cập nhật ngôn ngữ thành công");
      } else {
        await api.post("/languages", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Tạo ngôn ngữ thành công");
      }
      setShowDialog(false);
      fetchLanguages();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi lưu ngôn ngữ");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa ngôn ngữ này?")) return;
    try {
      await api.delete(`/languages/${id}`);
      toast.success("Xóa thành công");
      fetchLanguages();
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedIds.length === 0) return toast.error("Chưa chọn mục nào");

    if (!confirm(`Xóa ${selectedIds.length} ngôn ngữ đã chọn?`)) return;

    try {
      await api.post("/languages/delete-multiple", { ids: selectedIds });
      toast.success("Xóa nhiều thành công");
      setSelectedIds([]);
      fetchLanguages();
    } catch {
      toast.error("Xóa nhiều thất bại");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b text-black">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <CardTitle className="text-3xl font-bold">Quản lý Ngôn ngữ</CardTitle>
              {loading && <Loader2 className="w-6 h-6 animate-spin" />}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm ngôn ngữ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64 bg-white"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={openAddDialog} className="bg-white text-black hover:bg-gray-100">
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm mới
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteMultiple}
                  disabled={selectedIds.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa ({selectedIds.length})
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <LanguageTable
            languages={filteredLanguages}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onEdit={openEditDialog}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <LanguageFormDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        formData={formData}
        setFormData={setFormData}
        isEditing={isEditing}
        onSubmit={handleSave}
      />
    </div>
  );
};

export default LanguageManagement;