// src/hooks/useUsers.ts
import { useState, useEffect, useCallback } from "react";
import api from "@/services/api";
import { toast } from "sonner";

export interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  address: string;
  avatar?: string;
  role: { id: number; name: string };
  status: "active" | "inactive";
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const res = await api.get("/users", { 
        params: { 
          search: search || undefined,
          page,
          per_page: perPage
        } 
      });
      
      const responseData = res.data;
      let userList: User[] = [];
      let meta: PaginationMeta;
      
      if (responseData.data && responseData.data.data) {
        userList = responseData.data.data || [];
        meta = responseData.data.meta;
      } else if (responseData.data) {
        if (Array.isArray(responseData.data)) {
          userList = responseData.data;
          meta = {
            current_page: 1,
            last_page: 1,
            per_page: perPage,
            total: responseData.data.length,
            from: 1,
            to: responseData.data.length
          };
        } else {
          userList = responseData.data.data || [];
          meta = responseData.data.meta || {
            current_page: 1,
            last_page: 1,
            per_page: perPage,
            total: userList.length,
            from: 1,
            to: userList.length
          };
        }
      } else {
        userList = responseData || [];
        meta = {
          current_page: 1,
          last_page: 1,
          per_page: perPage,
          total: userList.length,
          from: 1,
          to: userList.length
        };
      }
      
      setUsers(userList);
      setTotal(meta.total || 0);
      setLastPage(meta.last_page || 1);
      setCurrentPage(meta.current_page || page);
      
    } catch (err: any) {
      console.error(err);
      toast.error("Không lấy được danh sách users");
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, perPage]);

  useEffect(() => {
    if (currentPage === 1) {
      fetchUsers(1);
    } else {
      setCurrentPage(1);
    }
  }, [search, perPage, fetchUsers]);

  useEffect(() => {
    if (currentPage > 0) {
      fetchUsers(currentPage);
    }
  }, [currentPage, fetchUsers]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const changePerPage = useCallback((n: number) => {
    setPerPage(n);
    setCurrentPage(1);
  }, []);

  const refresh = useCallback(() => {
    fetchUsers(currentPage);
  }, [currentPage, fetchUsers]);

  return {
    users,
    search,
    setSearch,
    goToPage,
    changePerPage,
    pagination: {
      currentPage,
      lastPage,
      total,
      perPage,
      canPaginate: !search 
    },
    refresh,
    loading,
  };
};