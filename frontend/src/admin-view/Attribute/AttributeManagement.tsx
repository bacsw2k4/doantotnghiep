import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { useAttributes, type Attribute } from "@/hooks/useAttributes";
import { DataTablePagination } from "@/components/dataTablePagination";
import { AttributeTable } from "./components/AttributeTable";
import { AttributeFormDialog } from "./components/AttributeFormDialog";
import api from "@/services/api";
import { Loader2 } from "lucide-react";

interface LayoutContext {
  selectedLangId: number;
  languages: { id: number; name: string }[];
}

const AttributeManagement = () => {
  const { selectedLangId, languages } = useOutletContext<LayoutContext>();
  
  const {
    treeData,
    flattenedDisplayed,
    search,
    setSearch,
    goToPage,
    changePerPage,
    pagination,
    refresh,
    loading,
    toggleNode
  } = useAttributes(selectedLangId);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Attribute>>({
    parentid: null,
    name: "",
    type: "text",
    color: "",
    image: "",
    order: 0,
    status: "active"
  });

  const handleOpenDialog = (attr?: Attribute) => {
    if (attr) {
      setFormData({
        ...attr,
        parentid: attr.parentid || null
      });
      setIsEditing(true);
    } else {
      setFormData({
        parentid: null,
        name: "",
        type: "text",
        color: "",
        image: "",
        order: 0,
        status: "active"
      });
      setIsEditing(false);
    }
    setShowDialog(true);
  };

  const handleGetMaxOrder = async (parentId: number | null, langId: number) => {
    try {
      const response = await api.get('/attributes/max-order', {
        params: { parentid: parentId, lang_id: langId }
      });
      return response.data.data.suggested_order;
    } catch (error) {
      console.error('Failed to get max order:', error);
      return 0;
    }
  };

  const handleSubmit = async (formDataObj: FormData) => {
    try {
      if (isEditing && formData.id) {
        await api.post(`/attributes/${formData.id}?_method=PUT`, formDataObj, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("Cập nhật thành công");
      } else {
        await api.post("/attributes", formDataObj, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("Tạo mới thành công");
      }
      setShowDialog(false);
      refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi lưu");
      throw err;
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa attribute này?")) return;
    try {
      await api.delete(`/attributes/${id}`);
      toast.success("Xóa thành công");
      refresh();
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedIds.length === 0) return toast.error("Chưa chọn attribute");
    if (!confirm(`Xóa ${selectedIds.length} attribute?`)) return;

    try {
      await api.post("/attributes/delete-multiple", { ids: selectedIds });
      toast.success("Xóa nhiều thành công");
      setSelectedIds([]);
      refresh();
    } catch {
      toast.error("Xóa nhiều thất bại");
    }
  };

  const possibleParents = flattenedDisplayed.filter(
    (a) =>
      a.parentid === null && (formData.id === undefined || a.id !== formData.id)
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle>Quản lý Attributes</CardTitle>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Input
                placeholder="Tìm kiếm attribute..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64"
              />

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleOpenDialog()}
                  className="whitespace-nowrap"
                >
                  + Thêm mới
                </Button>

                <Button
                  variant="destructive"
                  onClick={handleDeleteMultiple}
                  disabled={selectedIds.length === 0}
                  className="whitespace-nowrap"
                >
                  Xóa nhiều ({selectedIds.length})
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <AttributeTable
            attributes={treeData}
            flattened={flattenedDisplayed}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
            toggleNode={toggleNode}
          />

          {pagination.canPaginate && (
            <DataTablePagination
              currentPage={pagination.currentPage}
              totalPages={pagination.lastPage}
              perPage={pagination.perPage}
              totalItems={pagination.total}
              onPageChange={goToPage}
              onPerPageChange={changePerPage}
            />
          )}
        </CardContent>
      </Card>

      <AttributeFormDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        formData={formData}
        setFormData={setFormData}
        isEditing={isEditing}
        possibleParents={possibleParents}
        selectedLangId={selectedLangId}
        languages={languages}
        onSubmit={handleSubmit}
        onGetMaxOrder={handleGetMaxOrder}
      />
    </div>
  );
};

export default AttributeManagement; 