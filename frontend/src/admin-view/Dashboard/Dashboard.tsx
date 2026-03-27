import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DashboardData {
  totalOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  totalProducts: number;
  topProducts: { name: string; total_volume: number; price: number }[];
  totalUsers: number;
  newUsers: number;
  recentOrders: { id: number; customer: string; total_price: number; createdate: string; status: string }[];
  monthlyRevenue: { [key: string]: number };
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/admin/dashboard", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setData(response.data.data); // ← Quan trọng: lấy response.data.data
      } catch (error: any) {
        toast.error("Không thể tải dữ liệu dashboard: " + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="container mx-auto p-8 text-center">Đang tải dữ liệu...</div>;
  if (!data) return <div className="container mx-auto p-8 text-center">Không có dữ liệu</div>;

  // Chuẩn bị data cho biểu đồ (an toàn)
  const chartData = data.monthlyRevenue
    ? Object.keys(data.monthlyRevenue).map(month => ({
        month,
        revenue: data.monthlyRevenue[month] || 0,
      }))
    : [];

  return (
    <div className="w-full mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard Thống Kê</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Đơn Hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Doanh Thu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(data.totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh Thu Hôm Nay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(data.todayRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Sản Phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Người Dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người Dùng Mới (7 Ngày)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.newUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Biểu Đồ Doanh Thu */}
      <Card>
        <CardHeader>
          <CardTitle>Doanh Thu Theo Tháng (6 Tháng Qua)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatPrice(value).replace('₫', '')} />
                <Tooltip formatter={(value) => formatPrice(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-10">Chưa có dữ liệu doanh thu 6 tháng qua</div>
          )}
        </CardContent>
      </Card>

      {/* Top Sản Phẩm & Đơn Hàng Mới */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Sản Phẩm Bán Chạy</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản Phẩm</TableHead>
                    <TableHead>Số Lượng</TableHead>
                    <TableHead>Giá</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topProducts.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.total_volume}</TableCell>
                      <TableCell>{formatPrice(product.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500 py-4">Chưa có dữ liệu sản phẩm bán chạy</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Đơn Hàng Mới Nhất (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Khách Hàng</TableHead>
                    <TableHead>Tổng Tiền</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{formatPrice(order.total_price)}</TableCell>
                      <TableCell>{order.createdate}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.status === "completed"
                              ? "default"
                              : order.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500 py-4">Chưa có đơn hàng nào</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}