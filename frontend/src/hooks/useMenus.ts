import { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/services/api";
import type { Menu } from "@/admin-view/Menu/MenuManagement"; 

export const useMenus = (selectedLangId: number) => {
  const [treeData, setTreeData] = useState<Menu[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const updateNodeInTree = useCallback(
    (nodes: Menu[], nodeId: number, updater: (node: Menu) => Menu): Menu[] => {
      return nodes.map((node) => {
        if (node.id === nodeId) {
          return updater(node);
        }
        if (node.children && node.children.length > 0) {
          return {
            ...node,
            children: updateNodeInTree(node.children, nodeId, updater),
          };
        }
        return node;
      });
    },
    []
  );

  const fetchMenus = useCallback(
    async (page: number = 1) => {
      if (!selectedLangId) return;

      setLoading(true);
      try {
        const params: any = {
          lang_id: selectedLangId,
          page,
          per_page: search ? 1000 : perPage,
        };
        if (search) params.search = search;

        const res = await api.get("/menus", { params });
        const responseData = res.data;

        let data: any[] = [];
        let meta: any = {};

        if (search) {
          data = responseData.data || [];
          meta = responseData.meta || { total: data.length, current_page: 1, last_page: 1 };
        } else {
          data = responseData.data?.data || responseData.data || [];
          meta = responseData.meta || {};
        }

        const processTreeData = (nodes: any[], level = 0, isSearchMode = false): Menu[] => {
          return nodes.map((node) => {
            const hasChildrenField = node.children !== undefined;
            const isRoot = node.parentid === null;

            let children_loaded = false;
            if (hasChildrenField) {
              children_loaded = isRoot ? !!(node.children && node.children.length > 0) : true;
            }

            const processedChildren = node.children
              ? processTreeData(node.children, level + 1, isSearchMode)
              : [];

            return {
              ...node,
              children: processedChildren.length > 0 ? processedChildren : undefined,
              children_loaded,
              children_loading: false,
              expanded: isSearchMode,
              level,
            };
          });
        };

        const processed = processTreeData(data, 0, !!search);

        setTreeData(processed);
        setTotal(meta.total || data.length);
        setLastPage(meta.last_page || 1);
        setCurrentPage(meta.current_page || page);
      } catch (err: any) {
        console.error("Lỗi tải menu:", err);
        setTreeData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [selectedLangId, search, perPage]
  );

  const loadChildren = useCallback(
    async (nodeId: number) => {
      try {
        setTreeData((prev) =>
          updateNodeInTree(prev, nodeId, (node) => ({
            ...node,
            children_loading: true,
          }))
        );

        const res = await api.get(`/menus/children/${nodeId}`);
        const children = (res.data.data || []).map((item: any) => ({
          ...item,
          children_loaded: false,
          children_loading: false,
          expanded: false,
          level: (getNodeLevel(treeData, nodeId) || 0) + 1,
        }));

        setTreeData((prev) =>
          updateNodeInTree(prev, nodeId, (node) => ({
            ...node,
            children,
            children_loaded: true,
            children_loading: false,
          }))
        );
      } catch (err) {
        console.error("Lỗi tải children:", err);
        setTreeData((prev) =>
          updateNodeInTree(prev, nodeId, (node) => ({
            ...node,
            children_loading: false,
          }))
        );
      }
    },
    [treeData, updateNodeInTree]
  );

  const getNodeLevel = useCallback((nodes: Menu[], nodeId: number, currentLevel = 0): number | null => {
    for (const node of nodes) {
      if (node.id === nodeId) return currentLevel;
      if (node.children) {
        const found = getNodeLevel(node.children, nodeId, currentLevel + 1);
        if (found !== null) return found;
      }
    }
    return null;
  }, []);

  const toggleNode = useCallback(
    (nodeId: number) => {
      setTreeData((prev) =>
        updateNodeInTree(prev, nodeId, (node) => {
          const willExpand = !node.expanded;

          if (willExpand && !node.children_loaded && !node.children_loading) {
            setTimeout(() => loadChildren(nodeId), 0);
          }

          return { ...node, expanded: willExpand };
        })
      );
    },
    [loadChildren, updateNodeInTree]
  );

  const flattened = useMemo(() => {
    const flatten = (nodes: Menu[]): Menu[] => {
      let result: Menu[] = [];
      nodes.forEach((node) => {
        result.push(node);
        if (node.expanded && node.children) {
          result = result.concat(flatten(node.children));
        }
      });
      return result;
    };
    return flatten(treeData);
  }, [treeData]);

  useEffect(() => {
    if (selectedLangId) {
      setCurrentPage(1);
      fetchMenus(1);
    }
  }, [selectedLangId, search, fetchMenus]);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(page);
      fetchMenus(page);
    },
    [fetchMenus]
  );

  const changePerPage = useCallback((n: number) => {
    setPerPage(n);
    setCurrentPage(1);
  }, []);

  const refresh = useCallback(() => {
    fetchMenus(currentPage);
  }, [currentPage, fetchMenus]);

  return {
    treeData,
    flattened,
    loading,
    search,
    setSearch,
    toggleNode,
    refresh,
    goToPage,
    changePerPage,
    pagination: {
      currentPage,
      lastPage,
      total,
      perPage,
      canPaginate: !search,
    },
  };
};