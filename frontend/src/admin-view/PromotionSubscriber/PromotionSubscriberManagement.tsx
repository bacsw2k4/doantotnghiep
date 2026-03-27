import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { Loader2, Search, Plus, Trash2, Send } from "lucide-react";
import { PromotionSubscriberTable } from "./components/PromotionSubscriberTable"; 
import { PromotionSubscriberFormDialog } from "./components/PromotionSubscriberFormDialog"; 
import { PromotionSubscriberEmailDialog } from "./components/PromotionSubscriberEmailDialog"; 
import api from "@/services/api";

export interface PromotionSubscriber {
  id: number;
  email: string;
  status: "active" | "inactive";
  subscribed_at: string;
  created_at: string;
  updated_at: string;
}

const PromotionSubscriberManagement = () => {
  const [subscribers, setSubscribers] = useState<PromotionSubscriber[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState<PromotionSubscriber | null>(null);
  const [formData, setFormData] = useState<Partial<PromotionSubscriber>>({
    id: 0,
    email: "",
    status: "active",
  });

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/promotion-subscribers", {
        params: { search },
      });
      if (res.data.success) {
        setSubscribers(res.data.data || []);
      }
    } catch (error: any) {
      console.error("Error fetching subscribers:", error);
      toast.error("Không lấy được danh sách người đăng ký");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSubscribers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const openAddDialog = () => {
    setIsEditing(false);
    setFormData({
      id: 0,
      email: "",
      status: "active",
    });
    setShowFormDialog(true);
  };

  const openEditDialog = (subscriber: PromotionSubscriber) => {
    setFormData({
      ...subscriber,
    });
    setIsEditing(true);
    setShowFormDialog(true);
  };

  const openSingleEmailDialog = (subscriber: PromotionSubscriber) => {
    setSelectedSubscriber(subscriber);
    setShowEmailDialog(true);
  };

  const openMultipleEmailDialog = () => {
    if (selectedIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một người đăng ký để gửi email");
      return;
    }
    setSelectedSubscriber(null);
    setShowEmailDialog(true);
  };

  const handleSendEmail = async (data: { subject: string; content: string; ids?: number[] }) => {
    try {
      const response = await api.post("/promotion-subscribers/send-email", data);
      
      if (response.data.success) {
        const { sent_count, total, failed_emails } = response.data.data;
        
        if (failed_emails && failed_emails.length > 0) {
          toast.warning(
            `Đã gửi ${sent_count}/${total} email. Có ${failed_emails.length} email gửi thất bại`
          );
        } else {
          toast.success(`Đã gửi thành công ${sent_count} email`);
        }
        
        setShowEmailDialog(false);
      }
    } catch (err: any) {
      console.error("Send email error:", err);
      throw err;
    }
  };

  const handleSave = async (formDataToSend: FormData) => {
    try {
      if (isEditing && formData.id) {
        const response = await api.put(
          `/promotion-subscribers/${formData.id}`,
          {
            email: formDataToSend.get("email"),
            status: formDataToSend.get("status"),
          }
        );

        if (response.data.success) {
          toast.success("Cập nhật người đăng ký thành công");
        }
      } else {
        const response = await api.post("/promotion-subscribers", {
          email: formDataToSend.get("email"),
          status: formDataToSend.get("status"),
        });

        if (response.data.success) {
          toast.success("Thêm người đăng ký thành công");
        }
      }

      setShowFormDialog(false);
      fetchSubscribers();
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(
        err.response?.data?.message || "Lỗi khi lưu người đăng ký"
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa người đăng ký này?")) return;
    try {
      const response = await api.delete(`/promotion-subscribers/${id}`);
      if (response.data.success) {
        toast.success("Xóa thành công");
        fetchSubscribers();
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Xóa thất bại");
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedIds.length === 0) {
      toast.error("Chưa chọn người đăng ký để xóa");
      return;
    }
    if (!confirm("Bạn có chắc muốn xóa nhiều người đăng ký?")) return;
    try {
      const response = await api.post("/promotion-subscribers/delete-multiple", {
        ids: selectedIds,
      });
      if (response.data.success) {
        toast.success(`Xóa ${selectedIds.length} người đăng ký thành công`);
        setSelectedIds([]);
        fetchSubscribers();
      }
    } catch (error) {
      console.error("Delete multiple error:", error);
      toast.error("Xóa nhiều thất bại");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl font-bold">
                Quản lý Người đăng ký Khuyến mãi
              </CardTitle>
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm theo email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-64 pl-9"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={openAddDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm mới
                </Button>
                <Button
                  variant="outline"
                  onClick={openMultipleEmailDialog}
                  disabled={selectedIds.length === 0}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Gửi Email ({selectedIds.length})
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteMultiple}
                  disabled={selectedIds.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa nhiều ({selectedIds.length})
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <PromotionSubscriberTable
            subscribers={subscribers}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onEdit={openEditDialog}
            onDelete={handleDelete}
            onSendEmail={openSingleEmailDialog}
          />
        </CardContent>
      </Card>

      <PromotionSubscriberFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        formData={formData}
        setFormData={setFormData}
        isEditing={isEditing}
        onSubmit={handleSave}
      />

      <PromotionSubscriberEmailDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        selectedCount={selectedSubscriber ? 1 : selectedIds.length}
        recipientEmail={selectedSubscriber?.email}
        onSubmit={handleSendEmail}
        selectedIds={selectedIds}
        isSingle={!!selectedSubscriber}
      />
    </div>
  );
};

export default PromotionSubscriberManagement;