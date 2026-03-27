import { useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store/store";
import { 
  fetchCart, 
  addToCart as addToCartAction, 
  updateCartQuantity, 
  removeCartItem, 
  clearCartError,
  triggerCartRefetch,
  clearNeedsRefetch,
  markNeedsRefetch,
  setRefetching,
  updateCartBadge,  // ✅ Thêm import
  updateCartState   // ✅ Thêm import
} from "@/store/cart/cart-slice";

export const useCart = () => {
  const dispatch = useDispatch<AppDispatch>();
  const cart = useSelector((state: RootState) => state.cart);
  const isFetchingRef = useRef(false);

  const fetchCartItems = useCallback((langId: number, force = false) => {
    if (isFetchingRef.current && !force) {
      console.log("🔄 Already fetching, skip");
      return;
    }
    
    isFetchingRef.current = true;
    console.log("🔄 Starting cart fetch...");
    
    const promise = dispatch(fetchCart({ langId, force }));
    
    promise.finally(() => {
      isFetchingRef.current = false;
      console.log("✅ Cart fetch completed");
    });
    
    return promise;
  }, [dispatch]);

  const addToCart = useCallback((
    productId: number, 
    quantity?: number, 
    attributeIds?: string[], 
    langId?: number
  ) => {
    if (!langId) {
      throw new Error("Language ID is required");
    }
    console.log("🛒 Calling addToCart action");
    return dispatch(addToCartAction({ productId, quantity, attributeIds, langId }));
  }, [dispatch]);

  const updateQuantity = useCallback((id: string, quantity: number, langId: number) => {
    console.log("🔄 Calling updateQuantity action");
    return dispatch(updateCartQuantity({ id, quantity, langId }));
  }, [dispatch]);

  const removeItem = useCallback((id: string, langId: number) => {
    console.log("🗑️ Calling removeItem action");
    return dispatch(removeCartItem({ id, langId }));
  }, [dispatch]);

  const triggerRefetch = useCallback((langId: number) => {
    console.log("🎯 Triggering external refetch");
    return dispatch(triggerCartRefetch({langId}));
  }, [dispatch]);

  const markForRefetch = useCallback(() => {
    console.log("📌 Marking cart for refetch");
    dispatch(markNeedsRefetch());
  }, [dispatch]);

  const clearNeedsRefetchFlag = useCallback(() => {
    console.log("✅ Clearing needs refetch flag");
    dispatch(clearNeedsRefetch());
  }, [dispatch]);

  const setRefetchingState = useCallback((isRefetching: boolean) => {
    dispatch(setRefetching(isRefetching));
  }, [dispatch]);

  // ✅ THÊM: Hàm cập nhật badge ngay lập tức
  const updateCartBadgeImmediately = useCallback(({ 
    increment, 
    decrement 
  }: { 
    increment?: number; 
    decrement?: number 
  }) => {
    console.log(`📊 Updating cart badge immediately: increment=${increment}, decrement=${decrement}`);
    dispatch(updateCartBadge({ increment, decrement }));
  }, [dispatch]);

  // ✅ THÊM: Hàm cập nhật cart state
  const updateCartStateImmediately = useCallback(({
    totalItems,
    totalPrice,
    lastUpdated
  }: {
    totalItems?: number;
    totalPrice?: number;
    lastUpdated?: number;
  }) => {
    dispatch(updateCartState({ totalItems, totalPrice, lastUpdated }));
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearCartError());
  }, [dispatch]);

  return {
    ...cart,
    fetchCartItems,
    addToCart,
    updateQuantity,
    removeItem,
    triggerRefetch,
    markForRefetch,
    clearNeedsRefetch: clearNeedsRefetchFlag,
    setRefetching: setRefetchingState,
    updateCartBadge: updateCartBadgeImmediately,  // ✅ Thêm vào return
    updateCartState: updateCartStateImmediately,  // ✅ Thêm vào return
    clearError,
  };
};