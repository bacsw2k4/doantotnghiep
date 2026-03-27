import { useState, useCallback } from 'react';
import axios from 'axios';

interface ReviewData {
  id: number;
  rating: number;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
  user: {
    id: number;
    name: string;
    avatar: string | null;
  };
  replies: Array<{
    id: number;
    content: string;
    created_at: string;
    user: {
      id: number;
      name: string;
      avatar: string | null;
    };
  }>;
}

interface UseReviewsProps {
  productId: number;
  selectedLangId: number;
  isAuthenticated: boolean;
}

export const useReviews = ({ productId, selectedLangId, isAuthenticated }: UseReviewsProps) => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async (page = 1, filters = {}) => {
    if (!productId) return;

    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        per_page: 10,
        ...filters
      };

      const response = await axios.get(
        `http://localhost:8000/api/shopping/products/${productId}/reviews`,
        {
          params,
          headers: {
            'Accept-Language': selectedLangId.toString()
          }
        }
      );

      if (response.data.success) {
        setReviews(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải đánh giá');
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [productId, selectedLangId]);

  const submitReview = useCallback(async (data: { rating: number; comment: string }) => {
    if (!isAuthenticated) {
      throw new Error('Vui lòng đăng nhập để đánh giá');
    }

    const token = localStorage.getItem('token');
    
    try {
      const response = await axios.post(
        `http://localhost:8000/api/shopping/products/${productId}/reviews`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept-Language': selectedLangId.toString(),
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Refresh reviews after submission
        await fetchReviews(1);
        return response.data;
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Không thể gửi đánh giá');
    }
  }, [productId, selectedLangId, isAuthenticated, fetchReviews]);

  const updateReview = useCallback(async (reviewId: number, data: { rating: number; comment: string }) => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await axios.put(
        `http://localhost:8000/api/reviews/${reviewId}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept-Language': selectedLangId.toString(),
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        await fetchReviews(1);
        return response.data;
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Không thể cập nhật đánh giá');
    }
  }, [fetchReviews]);

  const deleteReview = useCallback(async (reviewId: number) => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await axios.delete(
        `http://localhost:8000/api/reviews/${reviewId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept-Language': selectedLangId.toString()
          }
        }
      );

      if (response.data.success) {
        await fetchReviews(1);
        return response.data;
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Không thể xóa đánh giá');
    }
  }, [fetchReviews]);

  return {
    reviews,
    loading,
    error,
    fetchReviews,
    submitReview,
    updateReview,
    deleteReview
  };
};