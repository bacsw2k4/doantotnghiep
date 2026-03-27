"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Search, Plus, Trash2 } from "lucide-react";
import { VoucherTable } from "./components/VoucherTable";
import { VoucherFormDialog } from "./components/VoucherFormDialog";
import { DataTablePagination } from "@/components/dataTablePagination";
import api from "@/services/api";

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

const VoucherManagement = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
    canPaginate: false
  });

  const [formData, setFormData] = useState({
    id: 0,
    code: "",
    name: "",
    image: null as File | null | string,
    type: "percentage" as "percentage" | "fixed",
    discount: 0,
    minmoney: null as number | null,
    status: "active" as "active" | "inactive",
    enddate: null as string | null
  });

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/vouchers", {
        params: {
          page: pagination.currentPage,
          per_page: pagination.perPage,
          search
        }
      });
      
      const data = res.data.data;
      setVouchers(data.data || []);
      setPagination({
        currentPage: data.current_page || 1,
        lastPage: data.last_page || 1,
        perPage: data.per_page || 10,
        total: data.total || 0,
        canPaginate: data.last_page > 1
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Không lấy được danh sách voucher");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [pagination.currentPage, pagination.perPage, search]);

  const openAddDialog = () => {
    setIsEditing(false);
    setFormData({
      id: 0,
      code: "",
      name: "",
      image: null,
      type: "percentage",
      discount: 0,
      minmoney: null,
      status: "active",
      enddate: null
    });
    setShowDialog(true);
  };

  const openEditDialog = (voucher: Voucher) => {
    setIsEditing(true);
    setFormData({
      id: voucher.id,
      code: voucher.code,
      name: voucher.name,
      image: voucher.image,
      type: voucher.type,
      discount: voucher.discount,
      minmoney: voucher.minmoney,
      status: voucher.status,
      enddate: voucher.enddate
    });
    setShowDialog(true);
  };

  const handleSave = async (formDataFromDialog: FormData) => {
    try {
      if (isEditing && formData.id) {
        formDataFromDialog.append("_method", "PUT");
        await api.post(`/vouchers/${formData.id}`, formDataFromDialog, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Cập nhật voucher thành công");
      } else {
        await api.post("/vouchers", formDataFromDialog, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Tạo voucher thành công");
      }

      setShowDialog(false);
      fetchVouchers();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Lỗi khi lưu voucher");
      throw err;
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa voucher này?")) return;
    try {
      await api.delete(`/vouchers/${id}`);
      toast.success("Xóa thành công");
      fetchVouchers();
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedIds.length === 0) {
      toast.error("Chưa chọn voucher nào");
      return;
    }
    if (!confirm(`Xóa ${selectedIds.length} voucher đã chọn?`)) return;

    try {
      await api.post("/vouchers/delete-multiple", { ids: selectedIds });
      toast.success("Xóa nhiều thành công");
      setSelectedIds([]);
      fetchVouchers();
    } catch {
      toast.error("Xóa nhiều thất bại");
    }
  };

  const goToPage = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const changePerPage = (perPage: number) => {
    setPagination(prev => ({ ...prev, perPage, currentPage: 1 }));
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl font-bold">
                Quản lý Vouchers
              </CardTitle>
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm voucher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={openAddDialog}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Thêm mới
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteMultiple}
                  disabled={selectedIds.length === 0}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa nhiều ({selectedIds.length})
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <VoucherTable
            vouchers={vouchers}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onEdit={openEditDialog}
            onDelete={handleDelete}
          />

          {/* Phân trang */}
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

      <VoucherFormDialog
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

export default VoucherManagement;