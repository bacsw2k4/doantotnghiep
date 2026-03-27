import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Check, Trash2, Reply, X, MessageSquare } from "lucide-react";
import type { Review } from "../ReviewManagement";

interface ReviewRowProps {
	review: Review;
	selectedIds: number[];
	setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
	onDelete: (id: number) => void;
	onApprove: (id: number) => void;
	onReject: (review: Review) => void;
	onReply: (review: Review) => void;
	formatDate: (dateString: string) => string;
	renderStars: (rating: number) => React.ReactNode;
	getStatusBadge: (status: string) => React.ReactNode | null;
}

export const ReviewRow = ({
	review,
	selectedIds,
	setSelectedIds,
	onDelete,
	onApprove,
	onReject,
	onReply,
	formatDate,
	renderStars,
	getStatusBadge
}: ReviewRowProps) => {
	const isSelected = selectedIds.includes(review.id);

	const handleCheckboxChange = (checked: boolean) => {
		setSelectedIds((prev) =>
			checked ? [...prev, review.id] : prev.filter((id) => id !== review.id)
		);
	};

	return (
		<TableRow key={review.id} className={isSelected ? "bg-muted/50" : ""}>
			<TableCell>
				<Checkbox checked={isSelected} onCheckedChange={handleCheckboxChange} />
			</TableCell>
			<TableCell className="font-mono text-sm">{review.id}</TableCell>
			<TableCell>
				<div className="space-y-1">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
							{review.user.avatar ? (
								<img
									src={review.user.avatar}
									alt={review.user.firstname}
									className="h-full w-full object-cover"
								/>
							) : (
								<div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-semibold text-sm">
									{review.user.firstname.charAt(0).toUpperCase()}
								</div>
							)}
						</div>
						<div>
							<div className="font-medium">
								{review.user.firstname} {review.user.lastname}
							</div>
							<div className="text-sm text-gray-500 truncate max-w-[180px]">
								{review.user.email}
							</div>
						</div>
					</div>
				</div>
			</TableCell>
			<TableCell>
				<div className="space-y-1">
					<div className="flex items-center gap-3">
						{review.product.image && (
							<img
								src={`http://localhost:8000/storage/${review.product.image}`}
								alt={review.product.name}
								className="h-10 w-10 object-cover rounded border"
							/>
						)}
						<div>
							<div className="font-medium truncate max-w-[180px]">
								{review.product.name}
							</div>
							<div className="text-sm text-gray-500">
								ID: {review.product.id}
							</div>
						</div>
					</div>
				</div>
			</TableCell>
			<TableCell className="max-w-[200px]">
				<div className="space-y-2">
					<div className="flex items-center gap-1">
						{renderStars(review.rating)}
						<span className="ml-1 font-medium">{review.rating}.0</span>
					</div>
					{review.comment && (
						<div className="relative group">
							<div className="truncate text-sm text-gray-600">
								{review.comment}
							</div>
							<div className="absolute hidden group-hover:block z-10 w-80 p-3 bg-white border rounded-lg shadow-lg">
								<div className="flex items-start gap-2">
									<MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
									<p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
										{review.comment}
									</p>
								</div>
							</div>
						</div>
					)}
					{review.is_verified_purchase && (
						<Badge variant="outline" className="w-fit text-xs bg-green-50 text-green-700 border-green-200">
							<Check className="h-3 w-3 mr-1" />
							Đã mua hàng
						</Badge>
					)}
				</div>
			</TableCell>
			<TableCell>
				{getStatusBadge(review.status)}
			</TableCell>
			<TableCell>
				<div className="text-sm">
					<div>{formatDate(review.created_at)}</div>
					{review.rejection_reason && (
						<div className="text-red-600 text-xs mt-1 truncate max-w-[150px]" title={review.rejection_reason}>
							Lý do: {review.rejection_reason}
						</div>
					)}
				</div>
			</TableCell>
			<TableCell>
				<div className="flex flex-wrap gap-1 justify-start">
					{review.status === 'pending' && (
						<>
							<Button
								size="sm"
								variant="outline"
								onClick={() => onReject(review)}
								className="h-8 px-2"
							>
								<X className="h-3 w-3" />
							</Button>
							<Button
								size="sm"
								onClick={() => onApprove(review.id)}
								className="h-8 px-2"
							>
								<Check className="h-3 w-3" />
							</Button>
						</>
					)}

					{review.status === 'approved' && !review.has_reply && (
						<Button
							size="sm"
							variant="outline"
							onClick={() => onReply(review)}
							className="h-8 px-2"
						>
							<Reply className="h-3 w-3" />
						</Button>
					)}

					<Button
						size="sm"
						variant="destructive"
						onClick={() => onDelete(review.id)}
						className="h-8 px-2"
					>
						<Trash2 className="h-3 w-3" />
					</Button>
				</div>
			</TableCell>
		</TableRow>
	);
};