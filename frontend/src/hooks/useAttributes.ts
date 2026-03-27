// hooks/useAttributes.ts
import api from "@/services/api";
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";

export interface Attribute {
  id: number;
  lang_id: number;
  parentid: number | null;
  name: string;
  type?: string;
  color?: string;
  image?: string;
  order: number;
  status: "active" | "inactive";
  children?: Attribute[];
  children_loaded?: boolean;
  children_loading?: boolean;
  level?: number;
  expanded?: boolean;
  parent?: Attribute | null;
  created_at?: string;
  updated_at?: string;
}

export const useAttributes = (selectedLangId: number) => {
  const [treeData, setTreeData] = useState<Attribute[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const updateNodeInTree = useCallback((
    nodes: Attribute[],
    nodeId: number,
    updater: (node: Attribute) => Attribute
  ): Attribute[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return updater(node);
      }
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: updateNodeInTree(node.children, nodeId, updater)
        };
      }
      return node;
    });
  }, []);

  const fetchAttributes = useCallback(
    async (page: number = 1) => {
      if (!selectedLangId) return;
      
      setLoading(true);
      try {
        const res = await api.get("/attributes", {
          params: {
            lang_id: selectedLangId,
            page,
            per_page: perPage,
            search: search || undefined,
          },
        });
        const responseData = res.data;
        let data: any[] = [];
        let meta: any = {};
        
        if (search) {
          data = responseData.data || [];
          meta = responseData.meta || { total: data.length };
        } else {
          data = responseData.data?.data || responseData.data || [];
          meta = responseData.meta || responseData.data?.meta || {};
        }

        const processTreeData = (nodes: any[], level: number = 0, isSearchMode: boolean = false): Attribute[] => {
          return nodes.map(node => {
            const hasChildrenField = node.children !== undefined;
            const isRootNode = node.parentid === null;
            
            let children_loaded = false;
            
            if (hasChildrenField) {
              if (isRootNode) {
                children_loaded = !!(node.children && node.children.length > 0);
              } else {
                children_loaded = true;
              }
            }
            
            const processedChildren = node.children 
              ? processTreeData(node.children, level + 1, isSearchMode)
              : [];
            
            return {
              ...node,
              children: processedChildren,
              children_loaded,
              children_loading: false,
              expanded: isSearchMode, 
              level
            };
          });
        };

        const processedTree = processTreeData(data, 0, !!search);
                
        setTreeData(processedTree);
        setTotal(meta.total || data.length);
        setLastPage(meta.last_page || 1);
        setCurrentPage(meta.current_page || page);
        
      } catch (err: any) {
        toast.error("Không tải được danh sách attributes");
        setTreeData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [selectedLangId, search, perPage]
  );

  const loadChildren = useCallback(async (nodeId: number) => {
    try {
      setTreeData(prev => 
        updateNodeInTree(prev, nodeId, node => ({
          ...node,
          children_loading: true
        }))
      );
      
      const res = await api.get(`/attributes/${nodeId}/children`);
      const children = res.data.data || [];
            
      const processedChildren = children.map((child: any) => {
        const hasChildrenField = child.children !== undefined;
        const children_loaded = hasChildrenField ? (child.children && child.children.length > 0) : false;
        
        return {
          ...child,
          children: child.children || [],
          children_loaded,
          children_loading: false,
          expanded: false,
          level: (findNodeLevel(treeData, nodeId) || 0) + 1
        };
      });
      
      setTreeData(prev => 
        updateNodeInTree(prev, nodeId, node => ({
          ...node,
          children: processedChildren,
          children_loaded: true,
          children_loading: false
        }))
      );
      
    } catch (err) {
      toast.error("Không tải được children");
      setTreeData(prev => 
        updateNodeInTree(prev, nodeId, node => ({
          ...node,
          children_loading: false
        }))
      );
    }
  }, [treeData, updateNodeInTree]);

  const findNodeLevel = useCallback((
    nodes: Attribute[], 
    nodeId: number, 
    currentLevel = 0
  ): number | null => {
    for (const node of nodes) {
      if (node.id === nodeId) return currentLevel;
      if (node.children && node.children.length > 0) {
        const found = findNodeLevel(node.children, nodeId, currentLevel + 1);
        if (found !== null) return found;
      }
    }
    return null;
  }, []);

  const toggleNode = useCallback((nodeId: number) => {    
    setTreeData(prev => 
      updateNodeInTree(prev, nodeId, node => {
        const newExpanded = !node.expanded;
        
        if (newExpanded && !node.children_loaded && !node.children_loading) {
          setTimeout(() => loadChildren(nodeId), 0);
        }
        
        return {
          ...node,
          expanded: newExpanded
        };
      })
    );
  }, [loadChildren, updateNodeInTree]);

  const flattened = useMemo(() => {
    const flatten = (nodes: Attribute[]): Attribute[] => {
      let result: Attribute[] = [];
      nodes.forEach((node) => {
        result.push(node);
        if (node.expanded && node.children && node.children.length > 0) {
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
      fetchAttributes(1);
    }
  }, [selectedLangId, search, perPage, fetchAttributes]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    fetchAttributes(page);
  }, [fetchAttributes]);

  const changePerPage = useCallback((n: number) => {
    setPerPage(n);
    setCurrentPage(1); 
  }, []);

  const refresh = useCallback(() => {
    fetchAttributes(currentPage);
  }, [currentPage, fetchAttributes]);

  return {
    treeData,
    flatData: flattened, 
    displayedAttributes: treeData,
    flattenedDisplayed: flattened,
    search,
    setSearch,
    goToPage,
    changePerPage,
    pagination: { 
      currentPage, 
      lastPage, 
      total, 
      perPage,
      hasMore: lastPage > currentPage,
      canPaginate: !search 
    },
    refresh,
    loading,
    toggleNode,
    loadChildren
  };
};