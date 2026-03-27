import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ReviewRow } from "./ReviewRow";
import { Loader2, MessageSquare } from "lucide-react";
import type { Review } from "../ReviewManagement";

interface ReviewTableProps {
	reviews: Review[];
	selectedIds: number[];
	setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
	onDelete: (id: number) => void;
	onApprove: (id: number) => void;
	onReject: (review: Review) => void;
	onReply: (review: Review) => void;
	formatDate: (dateString: string) => string;
	renderStars: (rating: number) => React.ReactNode;
	getStatusBadge: (status: string) => React.ReactNode | null;
	loading: boolean;
}

export const ReviewTable = ({
	reviews,
	selectedIds,
	setSelectedIds,
	onDelete,
	onApprove,
	onReject,
	onReply,
	formatDate,
	renderStars,
	getStatusBadge,
	loading
}: ReviewTableProps) => {
	const isAllChecked = reviews.length > 0 && selectedIds.length === reviews.length;

	const handleSelectAll = (checked: boolean) => {
		setSelectedIds(checked ? reviews.map((r) => r.id) : []);
	};

	return (
		<div className="border rounded-lg overflow-hidden">
			<div className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow className="bg-gray-50">
							<TableHead className="w-10">
								<Checkbox
									checked={isAllChecked}
									onCheckedChange={handleSelectAll}
									aria-label="Select all"
								/>
							</TableHead>
							<TableHead className="w-10">ID</TableHead>
							<TableHead>Khách hàng</TableHead>
							<TableHead>Sản phẩm</TableHead>
							<TableHead className="min-w-[400px]">Đánh giá & Bình luận</TableHead>
							<TableHead className="w-32">Trạng thái</TableHead>
							<TableHead className="w-40">Ngày tạo</TableHead>
							<TableHead className="w-40">Hành động</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={8} className="h-24 text-center">
									<Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
									<p className="mt-2 text-gray-500">Đang tải reviews...</p>
								</TableCell>
							</TableRow>
						) : reviews.length === 0 ? (
							<TableRow>
								<TableCell colSpan={8} className="h-24 text-center">
									<MessageSquare className="h-12 w-12 text-gray-300 mx-auto" />
									<p className="mt-4 text-gray-500">Không tìm thấy review nào</p>
								</TableCell>
							</TableRow>
						) : (
							reviews.map((review) => (
								<ReviewRow
									key={review.id}
									review={review}
									selectedIds={selectedIds}
									setSelectedIds={setSelectedIds}
									onDelete={onDelete}
									onApprove={onApprove}
									onReject={onReject}
									onReply={onReply}
									formatDate={formatDate}
									renderStars={renderStars}
									getStatusBadge={getStatusBadge}
								/>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
};