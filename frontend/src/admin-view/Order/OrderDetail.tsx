import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "../../components/ui/table";
import { ArrowLeft } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { toast } from "react-toastify";
import api from "@/services/api";

interface Attribute {
	id: number;
	name: string;
	parentid: number | null;
	children?: Attribute[];
}

interface Product {
	name: string;
	price: string;
	saleprice?: string;
	image?: string;
	desc?: string;
}

interface OrderDetailItem {
	id: number;
	product?: Product;
	volume: number;
	price: string;
	total_price: string;
	attributes?: { id: number; attribute_id: number }[];
}

interface User {
	firstname: string;
	lastname: string;
	email: string;
	phone?: string;
	address?: string;
}

interface ShippingAddress {
	address: string;
	phone?: string;
	email?: string;
	name?: string;
	country?: string;
	city?: string;
	desc?: string;
}

interface OrderStatusHistory {
	id: number;
	status: string;
	note?: string;
	user?: { firstname: string; lastname: string };
	created_at: string;
	updated_at: string;
}

interface Order {
	id: number;
	user?: User;
	shipping_address?: ShippingAddress;
	voucher_code?: string | null;
	total_price: string;
	discount_total_price?: string;
	status: string;
	createdate: string;
	order_details?: OrderDetailItem[];
	status_histories?: OrderStatusHistory[];
}

const OrderDetail = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [order, setOrder] = useState<Order | null>(null);
	const [loading, setLoading] = useState(true);
	const [attributes, setAttributes] = useState<Attribute[]>([]);
	const [updating, setUpdating] = useState(false);
	const [statusNote, setStatusNote] = useState("");
	const [selectedStatus, setSelectedStatus] = useState("pending");

	useEffect(() => {
		fetchAttributes();
	}, []);

	useEffect(() => {
		if (id) fetchOrder();
	}, [id]);

	useEffect(() => {
		if (order) {
			setSelectedStatus(order.status);
		}
	}, [order]);

	const fetchAttributes = async () => {
		try {
			const res = await api.get("/attributes");
			const data = res.data?.data;
			if (Array.isArray(data)) {
				setAttributes(data);
			} else {
				setAttributes([]);
				console.error("Dữ liệu attributes không hợp lệ:", data);
			}
		} catch (err) {
			toast.error("Lỗi tải attributes");
			setAttributes([]);
		}
	};

	const fetchOrder = async () => {
		setLoading(true);
		try {
			const res = await api.get(`/orders/${id}`);
			setOrder(res.data.data);
		} catch (err) {
			toast.error("Lỗi tải thông tin đơn hàng");
			navigate("/admin/orders");
		} finally {
			setLoading(false);
		}
	};

	const handleStatusChange = async (status: string) => {
		const isSameStatus = status === order?.status;

		if (isSameStatus && !statusNote.trim()) {
			toast.warning("Vui lòng nhập ghi chú cho lần cập nhật này");
			return;
		}

		if (isSameStatus && statusNote.trim().length < 5) {
			toast.warning("Ghi chú phải có ít nhất 5 ký tự");
			return;
		}

		setUpdating(true);
		try {
			await api.patch(`/orders/${id}/status`, {
				status,
				note: statusNote.trim()
			});
			toast.success("Cập nhật trạng thái thành công!");
			fetchOrder();
			setStatusNote("");
		} catch (err) {
			toast.error("Lỗi cập nhật trạng thái!");
		} finally {
			setUpdating(false);
		}
	};

	const formatPrice = (price: string | undefined) =>
		price
			? parseFloat(price).toLocaleString("vi-VN", {
					style: "currency",
					currency: "VND"
			  })
			: "0₫";

	const getAttributeName = (attribute_id: number) => {
		// Kiểm tra nếu attributes không phải là mảng hoặc rỗng
		if (!Array.isArray(attributes) || attributes.length === 0) {
			return `#${attribute_id}`;
		}
		
		for (let parent of attributes) {
			if (parent.children && Array.isArray(parent.children)) {
				const child = parent.children.find((c) => c.id === attribute_id);
				if (child) return `${parent.name}: ${child.name}`;
			}
		}
		return `#${attribute_id}`;
	};

	const getStatusVariant = (
		status: string
	): "secondary" | "default" | "outline" | "destructive" => {
		const variants: Record<
			string,
			"secondary" | "default" | "outline" | "destructive"
		> = {
			pending: "secondary",
			confirmed: "default",
			processing: "outline",
			shipped: "outline",
			delivered: "default",
			cancelled: "destructive"
		};
		return variants[status] || "secondary";
	};

	const getStatusText = (status: string) => {
		const texts: Record<string, string> = {
			pending: "⏳ Chờ xác nhận",
			confirmed: "✅ Đã xác nhận",
			processing: "🔄 Đang xử lý",
			shipped: "🚚 Đã giao",
			delivered: "✨ Hoàn thành",
			cancelled: "❌ Hủy"
		};
		return texts[status] || status;
	};

	const getLatestNote = (order: Order) => {
		if (!order.status_histories || order.status_histories.length === 0) return "";
		
		const sorted = [...order.status_histories].sort(
			(a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
		);
		return sorted[0]?.note || "";
	};

	if (loading) return <div className="p-8 text-center">Đang tải...</div>;
	if (!order) return <div>Đơn hàng không tồn tại</div>;

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="outline" onClick={() => navigate("/admin/orders")}>
					<ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
				</Button>
				<h1 className="text-2xl font-bold">Đơn hàng #{order.id}</h1>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<Card className="lg:col-span-3 w-full">
					<CardHeader>
						<CardTitle>Thông tin đơn hàng</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 p-6 text-sm">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<span className="font-medium">Khách hàng:</span>{" "}
								{order.user?.firstname} {order.user?.lastname}
							</div>
							<div>
								<span className="font-medium">Email:</span> {order.user?.email}
							</div>
							<div>
								<span className="font-medium">Số điện thoại:</span>{" "}
								{order.user?.phone}
							</div>
							<div>
								<span className="font-medium">Ngày tạo:</span>{" "}
								{new Date(order.createdate).toLocaleString("vi-VN")}
							</div>
							<div className="flex items-center gap-2 col-span-2">
								<span className="font-medium">Trạng thái:</span>
								<div className="flex flex-col gap-1">
									<Badge variant={getStatusVariant(order.status)}>
										{getStatusText(order.status)}
									</Badge>
									{getLatestNote(order) && (
										<div className="text-xs text-gray-500 mt-1">
											📝 {getLatestNote(order)}
										</div>
									)}
								</div>
							</div>
							<div className="col-span-2">
								<span className="font-medium">Địa chỉ giao hàng:</span>{" "}
								{order.shipping_address?.address} (
								{order.shipping_address?.city},{" "}
								{order.shipping_address?.country})
							</div>
							<div>
								<span className="font-medium">Tổng tiền:</span>{" "}
								<span className="text-green-600 font-bold">
									{formatPrice(order.total_price)}
								</span>
							</div>
							<div>
								<span className="font-medium">Giảm giá:</span>{" "}
								<span className="text-green-600 font-bold">
									{formatPrice(order.discount_total_price)}
								</span>
							</div>
							{order.voucher_code && (
								<div>
									<span className="font-medium">Voucher:</span>{" "}
									<Badge>{order.voucher_code}</Badge>
								</div>
							)}
						</div>

						<div className="border-t pt-4 mt-4">
							<div className="flex justify-between items-center mb-3">
								<span className="font-medium text-lg">Cập nhật trạng thái</span>
							</div>
							<div className="flex gap-2">
								<Select
									value={selectedStatus}
									onValueChange={setSelectedStatus}
									disabled={updating}
								>
									<SelectTrigger className="w-[180px]">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="pending">⏳ Chờ xác nhận</SelectItem>
										<SelectItem value="confirmed">✅ Đã xác nhận</SelectItem>
										<SelectItem value="processing">🔄 Đang xử lý</SelectItem>
										<SelectItem value="shipped">🚚 Đã giao</SelectItem>
										<SelectItem value="delivered">✨ Hoàn thành</SelectItem>
										<SelectItem value="cancelled">❌ Hủy</SelectItem>
									</SelectContent>
								</Select>
								<Input
									placeholder="Ghi chú (tùy chọn)"
									value={statusNote}
									onChange={(e) => setStatusNote(e.target.value)}
									className="flex-1"
								/>
								<Button
									onClick={() => handleStatusChange(selectedStatus)}
									disabled={updating}
									className="min-w-[80px]"
								>
									{updating ? "..." : "Cập nhật"}
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="lg:col-span-3">
					<CardHeader>
						<CardTitle>Sản phẩm ({order.order_details?.length || 0})</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Hình ảnh</TableHead>
									<TableHead>Sản phẩm</TableHead>
									<TableHead>Đơn giá</TableHead>
									<TableHead>Giá KM</TableHead>
									<TableHead>Số lượng</TableHead>
									<TableHead>Tổng</TableHead>
									<TableHead>Attributes</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{order.order_details?.map((detail) => (
									<TableRow key={detail.id}>
										<TableCell>
											{detail.product?.image && (
												<img
													src={`http://localhost:8000/storage/${detail.product.image}`}
													alt={detail.product.name}
													className="h-16 w-16 object-cover"
												/>
											)}
										</TableCell>
										<TableCell>{detail.product?.name}</TableCell>
										<TableCell>{formatPrice(detail.price)}</TableCell>
										<TableCell>
											{formatPrice(detail.product?.saleprice)}
										</TableCell>
										<TableCell>{detail.volume}</TableCell>
										<TableCell>{formatPrice(detail.total_price)}</TableCell>
										<TableCell>
											{detail.attributes
												?.map((a) => getAttributeName(a.attribute_id))
												.join(", ") || "-"}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>

			{order.status_histories && order.status_histories.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>
							Lịch sử trạng thái ({order.status_histories.length})
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Trạng thái</TableHead>
									<TableHead>Ghi chú</TableHead>
									<TableHead>Nhân viên</TableHead>
									<TableHead>Thời gian</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{[...order.status_histories]
									.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
									.map((history) => (
									<TableRow key={history.id}>
										<TableCell>
											<Badge variant={getStatusVariant(history.status)}>
												{getStatusText(history.status)}
											</Badge>
										</TableCell>
										<TableCell>{history.note || "-"}</TableCell>
										<TableCell>
											{history.user?.firstname} {history.user?.lastname || "System"}
										</TableCell>
										<TableCell>
											{new Date(history.created_at).toLocaleString("vi-VN")}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
};

export default OrderDetail;