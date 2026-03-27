import { useState, useEffect, useCallback } from "react";
import api from "@/services/api";
import { toast } from "sonner";

export interface Category {
  id: number;
  name: string;
  lang_id: number;
}

export interface Product {
  id: number;
  lang_id: number;
  name: string;
  desc?: string;
  image?: string;
  attribute?: string;
  price?: number;
  saleprice?: number;
  totalview: number;
  order: number;
  status: string;
  categories?: Category[];
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

interface UseProductsParams {
  selectedLangId: number;
  search?: string;
  categoryIds?: number[];
}

export const useProducts = ({
  selectedLangId,
  search = "",
  categoryIds = [],
}: UseProductsParams) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(
    async (page: number, itemsPerPage: number) => {
      setLoading(true);
      try {
        const params: any = {
          lang_id: selectedLangId,
          page,
          per_page: itemsPerPage,
        };

        if (search.trim()) {
          params.search = search.trim();
        }

        if (categoryIds.length > 0) {
          params.category_ids = categoryIds.join(",");
        }

        const res = await api.get("/products", { params });
        const responseData = res.data;

        let productList: Product[] = [];
        let meta: PaginationMeta = {
          current_page: page,
          last_page: 1,
          per_page: itemsPerPage,
          total: 0,
        };

        if (responseData.data?.data) {
          productList = responseData.data.data;
          meta = responseData.data.meta || meta;
        } else if (Array.isArray(responseData.data)) {
          productList = responseData.data;
          meta = {
            current_page: 1,
            last_page: 1,
            per_page: itemsPerPage,
            total: responseData.data.length,
          };
        } else if (responseData.data) {
          productList = responseData.data.data || [];
          meta = responseData.data.meta || meta;
        } else {
          productList = Array.isArray(responseData) ? responseData : [];
        }

        setProducts(productList);
        setTotal(meta.total || 0);
        setLastPage(meta.last_page || 1);

        if (meta.current_page && meta.current_page !== page) {
          setCurrentPage(meta.current_page);
        }

        if (meta.per_page && meta.per_page !== itemsPerPage) {
          setPerPage(meta.per_page);
        }
      } catch (err: any) {
        console.error(err);
        toast.error("Không lấy được danh sách sản phẩm");
        setProducts([]);
        setTotal(0);
        setLastPage(1);
      } finally {
        setLoading(false);
      }
    },
    [selectedLangId, search, categoryIds] 
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLangId, search, categoryIds, perPage]);

  useEffect(() => {
    fetchProducts(currentPage, perPage);
  }, [currentPage, perPage, fetchProducts]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const changePerPage = useCallback((n: number) => {
    setPerPage(n);
  }, []);

  const refresh = useCallback(() => {
    fetchProducts(currentPage, perPage);
  }, [currentPage, perPage, fetchProducts]);

  return {
    products,
    loading,
    pagination: {
      currentPage,
      lastPage,
      perPage,
      total,
      canPaginate: lastPage > 1,
    },
    goToPage,
    changePerPage,
    refresh,
  };
};