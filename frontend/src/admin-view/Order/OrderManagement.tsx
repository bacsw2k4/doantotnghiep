"use client";

import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Checkbox } from "../../components/ui/checkbox";
import axios from "axios";
import { Search, Filter, Eye, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { DataTablePagination } from "@/components/dataTablePagination"; 

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
}

interface ShippingAddress {
  id: number;
  address: string;
  phone?: string;
  email?: string;
}

interface Order {
  id: number;
  user?: User;
  shipping_address?: ShippingAddress;
  voucher_code?: string | null;
  total_price: string;
  discount_total_price: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  createdate: string;
}

// Interface cho dữ liệu phân trang từ API
interface PaginatedResponse {
  data: Order[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

const api = axios.create({
  baseURL: "http://localhost:8000/api/",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Debounce cho tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) {
        setCurrentPage(1); // Reset về trang đầu khi tìm kiếm
        fetchOrders();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  // Fetch orders khi thay đổi trang hoặc số lượng mỗi trang
  useEffect(() => {
    fetchOrders();
  }, [currentPage, perPage]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = "/orders"; // ← điều chỉnh nếu route của bạn khác
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", currentPage.toString());
      params.append("per_page", perPage.toString());
      
      if (params.toString()) url += `?${params}`;

      const res = await api.get(url);
      
      // Xử lý dữ liệu phân trang
      if (res.data.data?.data) {
        // Laravel paginate với data wrapper
        setOrders(res.data.data.data);
        setCurrentPage(res.data.data.current_page || 1);
        setTotalPages(res.data.data.last_page || 1);
        setPerPage(res.data.data.per_page || 20);
        setTotalItems(res.data.data.total || 0);
      } else if (res.data.data && Array.isArray(res.data.data)) {
        // Nếu API trả về mảng trực tiếp (không phân trang)
        setOrders(res.data.data);
        setTotalItems(res.data.data.length);
        setTotalPages(1);
      } else {
        // Fallback
        setOrders([]);
        setTotalItems(0);
        setTotalPages(1);
      }
      
      setSelectedIds([]); // reset selection sau khi reload
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (orderId: number) => {
    if (!window.confirm(`Xóa đơn hàng #${orderId} và các dữ liệu liên quan?`)) return;

    setDeletingIds((prev) => [...prev, orderId]);
    try {
      await api.delete(`/admin/orders/${orderId}`);
      toast.success(`Đã xóa đơn hàng #${orderId}`);
      
      // Nếu xóa item cuối cùng trên trang và không phải trang đầu tiên
      if (orders.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchOrders();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể xóa đơn hàng này");
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== orderId));
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedIds.length === 0) {
      toast.error("Chưa chọn đơn hàng nào");
      return;
    }

    if (!window.confirm(`Xóa ${selectedIds.length} đơn hàng và các dữ liệu liên quan?`)) return;

    setDeletingIds([...selectedIds]);

    try {
      const res = await api.delete("/admin/orders/bulk-destroy", {
        data: { ids: selectedIds },
      });

      toast.success(res.data.message || `Đã xóa ${selectedIds.length} đơn hàng thành công`);
      
      // Refresh danh sách sau khi xóa
      fetchOrders();
      setSelectedIds([]);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        "Không thể xóa một số đơn hàng (có thể đang giao hoặc đã hoàn thành)";
      toast.error(message);

      if (err.response?.data?.invalid_ids) {
        const failedIds = err.response.data.invalid_ids;
        setSelectedIds((prev) => prev.filter((id) => !failedIds.includes(id)));
      }
    } finally {
      setDeletingIds([]);
    }
  };

  const formatPrice = (price: string) =>
    parseFloat(price || "0").toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: "⏳ Chờ xác nhận",
      confirmed: "✅ Đã xác nhận",
      processing: "🔄 Đang xử lý",
      shipped: "🚚 Đã giao",
      delivered: "✨ Hoàn thành",
      cancelled: "❌ Hủy",
    };
    return texts[status] || status;
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<string, any> = {
      pending: "secondary",
      confirmed: "default",
      processing: "outline",
      shipped: "outline",
      delivered: "default",
      cancelled: "destructive",
    };
    return variants[status] || "secondary";
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map((o) => o.id));
    }
  };

  // Xử lý thay đổi trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Xử lý thay đổi số lượng mỗi trang
  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // Reset về trang đầu khi thay đổi số lượng
  };

  if (loading && orders.length === 0) {
    return <div className="p-8 text-center">Đang tải danh sách đơn hàng...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Input
                  placeholder="Tìm theo tên khách / mã đơn..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="pending">⏳ Chờ xác nhận</SelectItem>
                  <SelectItem value="confirmed">✅ Đã xác nhận</SelectItem>
                  <SelectItem value="processing">🔄 Đang xử lý</SelectItem>
                  <SelectItem value="shipped">🚚 Đã giao</SelectItem>
                  <SelectItem value="delivered">✨ Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">❌ Hủy</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => { setCurrentPage(1); fetchOrders(); }}>
                <Filter className="h-4 w-4 mr-2" />
                Lọc
              </Button>

              <Button
                variant="destructive"
                onClick={handleDeleteMultiple}
                disabled={selectedIds.length === 0 || deletingIds.length > 0}
              >
                {deletingIds.length > 0 ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  `Xóa (${selectedIds.length})`
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === orders.length && orders.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Chọn tất cả"
                  />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Giảm giá</TableHead>
                <TableHead>Voucher</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length > 0 ? (
                orders.map((order) => {
                  const isDeleting = deletingIds.includes(order.id);
                  const isSelected = selectedIds.includes(order.id);

                  return (
                    <TableRow key={order.id} className={isDeleting ? "opacity-60" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => {
                            setSelectedIds((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== order.id)
                                : [...prev, order.id]
                            );
                          }}
                          disabled={isDeleting}
                        />
                      </TableCell>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>
                        {order.user
                          ? `${order.user.firstname} ${order.user.lastname}`
                          : "Khách vãng lai"}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {order.shipping_address?.address || "—"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(order.total_price)}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatPrice(order.discount_total_price)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.voucher_code ? "default" : "secondary"}>
                          {order.voucher_code || "Không"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdate).toLocaleString("vi-VN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" asChild>
                            <a href={`/admin/orders/${order.id}`}>
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive/90"
                            onClick={() => handleDelete(order.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="h-48 text-center text-muted-foreground">
                    Không tìm thấy đơn hàng nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Component phân trang */}
          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            perPage={perPage}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderManagement;