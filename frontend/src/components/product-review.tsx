import { useState, useEffect } from "react";
import {
  Star,
  Check,
  MessageSquare,
  ChevronDown,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import axios from "axios";
import { toast } from "react-toastify";

interface Review {
  id: number;
  rating: number;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
  formatted_date?: string;
  user: {
    id: number;
    name: string;
    avatar: string | null;
  };
  replies: {
    id: number;
    content: string;
    created_at: string;
    formatted_date?: string;
    user: {
      id: number;
      name: string;
      avatar: string | null;
    };
  }[];
  can_edit: boolean;
  can_delete: boolean;
}

interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: Array<{
    rating: number;
    count: number;
  }>;
}

interface ReviewFilters {
  rating?: number;
  sort: 'latest' | 'highest' | 'lowest' | 'oldest';
}

interface ProductReviewProps {
  productId: number;
  selectedLangId: number;
  isAuthenticated: boolean;
  onReviewAdded?: () => void;
}

const ProductReview = ({
  productId,
  selectedLangId,
  isAuthenticated,
  onReviewAdded,
}: ProductReviewProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [canReview, setCanReview] = useState({
    can_review: false,
    has_reviewed: false,
    has_purchased: false,
    can_verified_purchase: false
  });

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [editing, setEditing] = useState(false); // Thêm state cho chế độ chỉnh sửa
  const [filters, setFilters] = useState<ReviewFilters>({ sort: 'latest' });
  const perPage = 5;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch (error) {
      return dateString;
    }
  };

  const fetchReviewStats = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/shopping/products/${productId}/reviews/stats`,
        { headers: { 'Accept-Language': selectedLangId.toString() } }
      );
      if (response.data.success) setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching review stats:', error);
    }
  };

  const fetchUserReview = async () => {
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/shopping/products/${productId}/user-review`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept-Language': selectedLangId.toString()
          }
        }
      );
      if (response.data.success) {
        const reviewData = response.data.data;
        setUserReview({
          ...reviewData,
          formatted_date: formatDate(reviewData.created_at),
          replies: reviewData.replies?.map((reply: any) => ({
            ...reply,
            formatted_date: formatDate(reply.created_at)
          })) || []
        });
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error fetching user review:', error);
      }
    }
  };

  const checkCanReview = async () => {
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/shopping/products/${productId}/can-review`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept-Language': selectedLangId.toString()
          }
        }
      );
      if (response.data.success) {
        setCanReview(response.data.data);
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    }
  };

  const fetchReviews = async (pageNum = 1, reset = false) => {
    setLoading(true);
    try {
      const params: any = {
        page: pageNum,
        per_page: perPage,
        sort: filters.sort
      };
      if (filters.rating) params.rating = filters.rating;

      const response = await axios.get(
        `http://localhost:8000/api/shopping/products/${productId}/reviews`,
        { params, headers: { 'Accept-Language': selectedLangId.toString() } }
      );

      if (response.data.success) {
        const newReviews = response.data.data.map((review: Review) => ({
          ...review,
          formatted_date: formatDate(review.created_at),
          replies: review.replies?.map((reply) => ({
            ...reply,
            formatted_date: formatDate(reply.created_at)
          })) || []
        }));

        if (reset) {
          setReviews(newReviews);
        } else {
          setReviews((prev) => [...prev, ...newReviews]);
        }

        setTotalPages(response.data.meta.last_page);
        setHasMore(response.data.meta.current_page < response.data.meta.last_page);
      }
    } catch (error) {
      toast.error('Không thể tải đánh giá. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchReviews(nextPage, false);
    }
  };

  const validateBeforeSubmit = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đánh giá sản phẩm');
      return false;
    }
    if (!canReview.has_purchased) {
      toast.error('Bạn cần phải mua sản phẩm này để có thể đánh giá');
      return false;
    }
    if (canReview.has_reviewed && !userReview) {
      toast.error('Bạn chỉ có thể đánh giá sản phẩm này một lần');
      return false;
    }
    if (!comment.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá');
      return false;
    }
    return true;
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBeforeSubmit()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8000/api/shopping/products/${productId}/reviews`,
        { rating, comment: comment.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept-Language': selectedLangId.toString(),
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setComment('');
        setRating(5);
        fetchReviewStats();
        fetchUserReview();
        fetchReviews(1, true);
        setPage(1);
        if (onReviewAdded) onReviewAdded();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userReview) return;
    if (!validateBeforeSubmit()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:8000/api/shopping/reviews/${userReview.id}`,
        { rating, comment: comment.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept-Language': selectedLangId.toString(),
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Cập nhật đánh giá thành công');
        const updatedReview = {
          ...response.data.data,
          formatted_date: formatDate(response.data.data.created_at),
          replies: response.data.data.replies?.map((reply: any) => ({
            ...reply,
            formatted_date: formatDate(reply.created_at)
          })) || []
        };
        setUserReview(updatedReview);
        setEditing(false);
        fetchReviewStats();
        fetchReviews(1, true);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật đánh giá. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview || !window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `http://localhost:8000/api/shopping/reviews/${userReview.id}`,
        { headers: { Authorization: `Bearer ${token}`, 'Accept-Language': selectedLangId.toString() } }
      );

      if (response.data.success) {
        toast.success('Xóa đánh giá thành công');
        setUserReview(null);
        setEditing(false);
        setComment('');
        setRating(5);
        setCanReview(prev => ({ ...prev, has_reviewed: false }));
        fetchReviewStats();
        fetchReviews(1, true);
      }
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast.error(error.response?.data?.message || 'Không thể xóa đánh giá. Vui lòng thử lại sau.');
    }
  };

  const startEditing = () => {
    if (userReview) {
      setRating(userReview.rating);
      setComment(userReview.comment);
      setEditing(true);
    }
  };

  const cancelEditing = () => {
    setEditing(false);
    if (userReview) {
      setRating(userReview.rating);
      setComment(userReview.comment);
    } else {
      setRating(5);
      setComment('');
    }
  };

  useEffect(() => {
    if (userReview && !editing) {
      setRating(userReview.rating);
      setComment(userReview.comment);
    }
  }, [userReview, editing]);

  useEffect(() => {
    if (productId) {
      fetchReviewStats();
      fetchReviews(1, true);
      setPage(1);
      if (isAuthenticated) {
        checkCanReview();
        fetchUserReview();
      }
    }
  }, [productId, isAuthenticated, selectedLangId]);

  useEffect(() => {
    if (productId) {
      fetchReviews(1, true);
      setPage(1);
    }
  }, [filters]);

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    }[size];

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
          />
        ))}
      </div>
    );
  };

  const renderRatingBar = (rating: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex items-center gap-2">
        <span className="w-12 text-sm text-gray-600">{rating} sao</span>
        <div className="flex-1 h-2 bg-gray-400 rounded-full overflow-hidden">
          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
        </div>
        <span className="w-16 text-sm text-gray-600 text-right">{count} ({percentage.toFixed(0)}%)</span>
      </div>
    );
  };

  if (!stats) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Review Stats */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="text-5xl font-bold text-gray-900">{stats.average_rating.toFixed(1)}</div>
            <div className="mt-2 flex justify-center">{renderStars(Math.round(stats.average_rating), 'lg')}</div>
            <div className="mt-2 text-sm text-gray-600">{stats.total_reviews} đánh giá</div>
          </div>

          <div className="space-y-2">
            {stats.rating_distribution.map((item) => (
              <div key={item.rating}>
                {renderRatingBar(item.rating, item.count, stats.total_reviews)}
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* User's Review Section */}
          {isAuthenticated && userReview ? (
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Đánh giá của bạn</h3>
                <div className="flex items-center gap-2">
                  {userReview.can_edit && !editing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={startEditing}
                      className="h-8 px-2 text-primary hover:bg-primary/10"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Chỉnh sửa
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteReview}
                    className="h-8 px-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Xóa
                  </Button>
                </div>
              </div>

              {editing ? (
                // Edit Mode
                <form onSubmit={handleUpdateReview}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Đánh giá của bạn</label>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1"
                        >
                          <Star
                            className={`h-8 w-8 ${star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-lg font-medium">{rating} sao</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Nhận xét của bạn</label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                      rows={4}
                      className="resize-none"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      type="submit"
                      disabled={submitting || !comment.trim()}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {submitting ? 'Đang xử lý...' : 'Cập nhật'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEditing}
                    >
                      Hủy
                    </Button>
                  </div>
                </form>
              ) : (
                // View Mode
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      {renderStars(userReview.rating, 'md')}
                      <span className="ml-2 font-medium">{userReview.rating} sao</span>
                    </div>
                    <span className="text-sm text-gray-500">{userReview.formatted_date}</span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{userReview.comment}</p>
                  </div>

                  {userReview.is_verified_purchase && (
                    <div className="flex items-center text-sm text-green-600">
                      <Check className="h-4 w-4 mr-1" />
                      <span>Đã xác nhận mua hàng</span>
                    </div>
                  )}
                </>
              )}

              {/* Replies to user's review */}
              {userReview.replies && userReview.replies.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-4">Phản hồi từ shop</h4>
                  {userReview.replies.map((reply) => (
                    <div key={reply.id} className="bg-gray-50 rounded-lg p-4 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 overflow-hidden">
                            {reply.user.avatar ? (
                              <img src={reply.user.avatar} alt={reply.user.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-primary text-white text-xs font-semibold">
                                {reply.user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">
                              {reply.user.name}
                            </div>
                            <div className="text-xs text-gray-500">{reply.formatted_date}</div>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Create New Review Form (when user hasn't reviewed)
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Viết đánh giá của bạn</h3>
              
              <form onSubmit={handleSubmitReview}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Đánh giá của bạn</label>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1"
                      >
                        <Star
                          className={`h-8 w-8 ${star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-lg font-medium">{rating} sao</span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Nhận xét của bạn</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                    rows={4}
                    className="resize-none"
                    required
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="submit"
                    disabled={submitting || !comment.trim() || !canReview.can_review}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {submitting ? 'Đang xử lý...' : 'Gửi đánh giá'}
                  </Button>

                  <Button type="button" variant="ghost" onClick={() => setComment('')}>
                    Hủy
                  </Button>
                </div>

                {canReview.has_purchased && (
                  <div className="mt-3 flex items-center text-sm text-green-600">
                    <Check className="h-4 w-4 mr-1" />
                    <span>Đã xác nhận mua hàng</span>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Login prompt */}
          {!isAuthenticated && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                Vui lòng{' '}
                <a href="/login" className="font-semibold hover:underline">đăng nhập</a>{' '}
                để viết đánh giá về sản phẩm này.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Review Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="text-sm font-medium">Lọc theo:</div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filters.rating === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => setFilters(prev => ({ ...prev, rating: undefined }))}
          >
            Tất cả
          </Button>
          
          {[5, 4, 3, 2, 1].map((star) => (
            <Button
              key={star}
              variant={filters.rating === star ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, rating: star }))}
              className="flex items-center gap-1"
            >
              {star} <Star className="h-3 w-3 fill-current" />
            </Button>
          ))}
        </div>

        <div className="ml-auto">
          <select
            value={filters.sort}
            onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value as any }))}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="latest">Mới nhất</option>
            <option value="highest">Đánh giá cao nhất</option>
            <option value="lowest">Đánh giá thấp nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </div>
      </div>

      <Separator />

      {/* Other Users' Reviews List */}
      <div className="space-y-6">
        {loading && page === 1 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse p-6 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                  <div>
                    <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="h-4 w-20 bg-gray-200 rounded mb-3"></div>
                <div className="h-3 w-full bg-gray-200 rounded mb-1"></div>
                <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Chưa có đánh giá nào</h3>
            <p className="text-gray-500">Hãy là người đầu tiên đánh giá sản phẩm này</p>
          </div>
        ) : (
          <>
            {reviews
              .map((review) => (
              <div key={review.id} className="border rounded-lg p-6">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden">
                      {review.user.avatar ? (
                        <img src={review.user.avatar} alt={review.user.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-semibold">
                          {review.user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{review.user.name}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {review.formatted_date}
                        {review.is_verified_purchase && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                            <Check className="h-3 w-3" />
                            Đã mua hàng
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating)}
                    <span className="ml-1 font-medium">{review.rating}</span>
                  </div>
                </div>

                {/* Review Content */}
                <div className="mb-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{review.comment}</p>
                </div>

                {/* Replies */}
                {review.replies && review.replies.length > 0 && (
                  <div className="ml-10 mt-6 space-y-4">
                    {review.replies.map((reply) => (
                      <div key={reply.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 overflow-hidden">
                              {reply.user.avatar ? (
                                <img src={reply.user.avatar} alt={reply.user.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary text-white text-xs font-semibold">
                                  {reply.user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-sm">
                                {reply.user.name}
                                <span className="ml-2 text-xs text-primary font-normal">(Phản hồi từ shop)</span>
                              </div>
                              <div className="text-xs text-gray-500">{reply.formatted_date}</div>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-4">
                <Button onClick={loadMore} disabled={loading} variant="outline" className="w-full md:w-auto">
                  {loading ? 'Đang tải...' : 'Xem thêm đánh giá'}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {!hasMore && reviews.length > 0 && (
              <div className="text-center py-6 text-gray-500">Đã hiển thị tất cả đánh giá</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductReview;