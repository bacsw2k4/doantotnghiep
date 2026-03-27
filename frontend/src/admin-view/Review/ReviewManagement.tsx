"use client";

import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter
} from "@/components/ui/dialog";
import { toast } from "react-toastify";
import {
	Loader2,
	Search,
	Filter,
	MessageSquare,
	Star,
	User,
	Package,
	Check,
	X,
	Eye,
	Trash2,
} from "lucide-react";
import api from "@/services/api";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ReviewTable } from "./components/ReviewTable"; 

interface Language {
	id: number;
	name: string;
}

interface LayoutContext {
	selectedLangId: number;
	languages: Language[];
}

interface FilterState {
	status?: "pending" | "approved" | "rejected" | "all";
	rating?: number;
	product_id?: number;
	search: string;
}

export interface Review {
	id: number;
	product_id: number;
	user_id: number;
	rating: number;
	comment: string;
	is_verified_purchase: boolean;
	status: "pending" | "approved" | "rejected";
	has_reply: boolean;
	rejection_reason?: string;
	created_at: string;
	updated_at: string;
	user: {
		id: number;
		firstname: string;
		lastname: string;
		email: string;
		avatar: string | null;
	};
	product: {
		id: number;
		name: string;
		image: string | null;
	};
	replies: ReviewReply[];
}

export interface ReviewReply {
	id: number;
	review_id: number;
	user_id: number;
	reply_content: string;
	created_at: string;
	user: {
		id: number;
		firstname: string;
		lastname: string;
		avatar: string | null;
	};
}

const ReviewManagement = () => {
	const { selectedLangId, languages } = useOutletContext<LayoutContext>();

	const [reviews, setReviews] = useState<Review[]>([]);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [loading, setLoading] = useState(false);
	const [stats, setStats] = useState({
		total: 0,
		pending: 0,
		approved: 0,
		rejected: 0
	});

	const [filters, setFilters] = useState<FilterState>({
		status: undefined,
		rating: undefined,
		product_id: undefined,
		search: ""
	});

	const [showReplyDialog, setShowReplyDialog] = useState(false);
	const [showRejectDialog, setShowRejectDialog] = useState(false);
	const [selectedReview, setSelectedReview] = useState<Review | null>(null);
	const [replyContent, setReplyContent] = useState("");
	const [rejectionReason, setRejectionReason] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const fetchReviews = async () => {
		setLoading(true);
		try {
			const params: any = {};
			if (filters.status && filters.status !== "all")
				params.status = filters.status;
			if (filters.rating) params.rating = filters.rating;
			if (filters.product_id) params.product_id = filters.product_id;
			if (filters.search) params.search = filters.search;

			const res = await api.get("/reviews", { params });
			setReviews(res.data.data || []);
		} catch (error: any) {
			toast.error(
				error.response?.data?.message || "Không lấy được danh sách reviews"
			);
		} finally {
			setLoading(false);
		}
	};

	const fetchStatistics = async () => {
		try {
			const res = await api.get("/reviews/statistics");
			setStats({
				total: res.data.data.total_reviews || 0,
				pending: res.data.data.pending_reviews || 0,
				approved: res.data.data.approved_reviews || 0,
				rejected: res.data.data.rejected_reviews || 0
			});
		} catch (error) {
			console.error("Error fetching statistics:", error);
		}
	};

	useEffect(() => {
		if (languages.length > 0) {
			fetchReviews();
			fetchStatistics();
		}
	}, [selectedLangId, languages.length, filters]);

	const handleStatusUpdate = async (
		reviewId: number,
		status: "approved" | "rejected",
		reason?: string
	) => {
		setSubmitting(true);
		try {
			const data: any = { status };
			if (status === "rejected" && reason) {
				data.rejection_reason = reason;
			}

			await api.put(`/reviews/${reviewId}/status`, data);

			toast.success("Cập nhật trạng thái thành công");
			setShowRejectDialog(false);
			setRejectionReason("");

			fetchReviews();
			fetchStatistics();
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Cập nhật thất bại");
		} finally {
			setSubmitting(false);
		}
	};

	const handleApproveReview = async (reviewId: number) => {
		if (!confirm("Bạn có chắc muốn duyệt review này?")) return;
		await handleStatusUpdate(reviewId, "approved");
	};

	const handleSubmitReply = async () => {
		if (!selectedReview || !replyContent.trim()) {
			toast.error("Vui lòng nhập nội dung phản hồi");
			return;
		}

		setSubmitting(true);
		try {
			await api.post(`/reviews/${selectedReview.id}/replies`, {
				reply_content: replyContent
			});

			toast.success("Gửi phản hồi thành công");
			setShowReplyDialog(false);
			setReplyContent("");
			setSelectedReview(null);

			fetchReviews();
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Gửi phản hồi thất bại");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDeleteReply = async (replyId: number) => {
		if (!confirm("Bạn có chắc muốn xóa phản hồi này?")) return;

		try {
			await api.delete(`/replies/${replyId}`);
			toast.success("Xóa phản hồi thành công");
			fetchReviews();
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Xóa thất bại");
		}
	};

	const handleDeleteReview = async (id: number) => {
		if (!confirm("Bạn có chắc muốn xóa review này?")) return;

		try {
			await api.delete(`/reviews/${id}`);
			toast.success("Xóa review thành công");
			setSelectedIds(selectedIds.filter((reviewId) => reviewId !== id));
			fetchReviews();
			fetchStatistics();
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Xóa thất bại");
		}
	};

	const handleDeleteMultiple = async () => {
		if (selectedIds.length === 0) {
			toast.error("Chưa chọn review nào");
			return;
		}

		if (!confirm(`Xóa ${selectedIds.length} review đã chọn?`)) return;

		try {
			await api.post("/reviews/delete-multiple", { ids: selectedIds });
			toast.success("Xóa nhiều thành công");
			setSelectedIds([]);
			fetchReviews();
			fetchStatistics();
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Xóa nhiều thất bại");
		}
	};

	const formatDate = (dateString: string) => {
		try {
			const date = new Date(dateString);
			return format(date, "dd/MM/yyyy HH:mm", { locale: vi });
		} catch (error) {
			return dateString;
		}
	};

	const renderStars = (rating: number) => {
		return (
			<div className="flex items-center gap-1">
				{[1, 2, 3, 4, 5].map((star) => (
					<Star
						key={star}
						className={`h-4 w-4 ${
							star <= rating
								? "fill-yellow-400 text-yellow-400"
								: "fill-gray-200 text-gray-200"
						}`}
					/>
				))}
			</div>
		);
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "pending":
				return (
					<Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
						Chờ duyệt
					</Badge>
				);
			case "approved":
				return (
					<Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
						Đã duyệt
					</Badge>
				);
			case "rejected":
				return (
					<Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
						Từ chối
					</Badge>
				);
			default:
				return null;
		}
	};

	return (
		<div className="p-6 space-y-6">
			{/* Statistics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Tổng số review
								</p>
								<p className="text-3xl font-bold mt-2">{stats.total}</p>
							</div>
							<div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
								<MessageSquare className="h-6 w-6 text-blue-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
								<p className="text-3xl font-bold mt-2">{stats.pending}</p>
							</div>
							<div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
								<Eye className="h-6 w-6 text-yellow-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Đã duyệt</p>
								<p className="text-3xl font-bold mt-2">{stats.approved}</p>
							</div>
							<div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
								<Check className="h-6 w-6 text-green-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Từ chối</p>
								<p className="text-3xl font-bold mt-2">{stats.rejected}</p>
							</div>
							<div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
								<X className="h-6 w-6 text-red-600" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Content */}
			<Card>
				<CardHeader>
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
						<div className="flex items-center gap-3">
							<CardTitle>Quản lý Đánh giá</CardTitle>
							{loading && <Loader2 className="h-5 w-5 animate-spin" />}
						</div>

						<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
							<div className="flex gap-2">
								<Button
									variant="destructive"
									onClick={handleDeleteMultiple}
									disabled={selectedIds.length === 0}
									size="sm"
								>
									<Trash2 className="h-4 w-4 mr-2" />
									Xóa nhiều ({selectedIds.length})
								</Button>
							</div>
						</div>
					</div>
				</CardHeader>

				<CardContent>
					{/* Filters */}
					<div className="mb-6 p-4 border rounded-lg space-y-4">
						<div className="flex items-center gap-2 mb-3">
							<Filter className="h-5 w-5 text-gray-500" />
							<h3 className="font-medium">Bộ lọc</h3>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label className="text-sm">Trạng thái</Label>
								<Select
									value={filters.status || "all"}
									onValueChange={(value) =>
										setFilters((prev) => ({
											...prev,
											status: value === "all" ? undefined : (value as any)
										}))
									}
								>
									<SelectTrigger className="w-full !h-[40px]">
										<SelectValue placeholder="Tất cả trạng thái" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Tất cả</SelectItem>
										<SelectItem value="pending">Chờ duyệt</SelectItem>
										<SelectItem value="approved">Đã duyệt</SelectItem>
										<SelectItem value="rejected">Từ chối</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label className="text-sm">Đánh giá</Label>
								<Select
									value={filters.rating?.toString() || "all"}
									onValueChange={(value) =>
										setFilters((prev) => ({
											...prev,
											rating: value === "all" ? undefined : parseInt(value)
										}))
									}
								>
									<SelectTrigger className="w-full !h-[40px]">
										<SelectValue placeholder="Tất cả đánh giá" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Tất cả</SelectItem>
										<SelectItem value="5">5 sao</SelectItem>
										<SelectItem value="4">4 sao</SelectItem>
										<SelectItem value="3">3 sao</SelectItem>
										<SelectItem value="2">2 sao</SelectItem>
										<SelectItem value="1">1 sao</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label className="text-sm">Tìm kiếm</Label>
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
									<Input
										placeholder="Tên người dùng, sản phẩm, comment..."
										value={filters.search}
										onChange={(e) =>
											setFilters((prev) => ({
												...prev,
												search: e.target.value
											}))
										}
										className="pl-10 !h-[40px] w-full"
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Reviews Table */}
					<ReviewTable
						reviews={reviews}
						selectedIds={selectedIds}
						setSelectedIds={setSelectedIds}
						onDelete={handleDeleteReview}
						onApprove={handleApproveReview}
						onReject={(review) => {
							setSelectedReview(review);
							setRejectionReason("");
							setShowRejectDialog(true);
						}}
						onReply={(review) => {
							setSelectedReview(review);
							setReplyContent("");
							setShowReplyDialog(true);
						}}
						formatDate={formatDate}
						renderStars={renderStars}
						getStatusBadge={getStatusBadge}
						loading={loading}
					/>
				</CardContent>
			</Card>

			{/* Reply Dialog */}
			<Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Phản hồi đánh giá</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						{selectedReview && (
							<div className="space-y-4 p-4 border rounded-lg bg-gray-50">
								<div className="flex items-center gap-2">
									{renderStars(selectedReview.rating)}
									<span className="font-medium">
										{selectedReview.rating} sao
									</span>
								</div>
								<div>
									<Label className="text-sm text-gray-500">Nội dung review:</Label>
									<p className="text-gray-700 mt-1 p-3 bg-white rounded border">
										{selectedReview.comment}
									</p>
								</div>
							</div>
						)}

						<div className="space-y-2">
							<Label>Nội dung phản hồi</Label>
							<Textarea
								value={replyContent}
								onChange={(e) => setReplyContent(e.target.value)}
								placeholder="Nhập phản hồi của bạn..."
								rows={4}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowReplyDialog(false)}
							disabled={submitting}
						>
							Hủy
						</Button>
						<Button
							onClick={handleSubmitReply}
							disabled={submitting || !replyContent.trim()}
						>
							{submitting ? (
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
							) : null}
							Gửi phản hồi
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Reject Dialog */}
			<Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Từ chối đánh giá</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						{selectedReview && (
							<div className="space-y-4 p-4 border rounded-lg bg-gray-50">
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<User className="h-4 w-4" />
										<span className="font-medium">
											{selectedReview.user.firstname} {selectedReview.user.lastname}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<Package className="h-4 w-4" />
										<span>{selectedReview.product.name}</span>
									</div>
									<div className="flex items-center gap-2">
										{renderStars(selectedReview.rating)}
										<span>{selectedReview.rating} sao</span>
									</div>
								</div>
								<div>
									<Label className="text-sm text-gray-500">Nội dung review:</Label>
									<p className="text-gray-700 mt-1 p-3 bg-white rounded border">
										{selectedReview.comment}
									</p>
								</div>
							</div>
						)}

						<div className="space-y-2">
							<Label>Lý do từ chối (tùy chọn)</Label>
							<Textarea
								value={rejectionReason}
								onChange={(e) => setRejectionReason(e.target.value)}
								placeholder="Nhập lý do từ chối..."
								rows={3}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setShowRejectDialog(false);
								setRejectionReason("");
							}}
							disabled={submitting}
						>
							Hủy
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								if (selectedReview) {
									handleStatusUpdate(
										selectedReview.id,
										"rejected",
										rejectionReason
									);
								}
							}}
							disabled={submitting}
						>
							{submitting ? (
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
							) : null}
							Từ chối
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default ReviewManagement;