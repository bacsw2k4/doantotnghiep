import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string | null;
  product_id: number;
  langId: string;
}

interface CartResponse {
  data: CartItem[];
  total_items: number;
  total_price: number;
}

interface CartState {
  cartItems: CartItem[];
  totalItems: number;
  totalPrice: number;
  loading: boolean;
  error: string | null;
  lastUpdated: number; 
  needsRefetch: boolean;
  isRefetching: boolean;
}

const initialState: CartState = {
  cartItems: [],
  totalItems: 0,
  totalPrice: 0,
  loading: false,
  error: null,
  lastUpdated: Date.now(),
  needsRefetch: false,
  isRefetching: false,
};

// Cache để tránh fetch trùng lặp
let currentFetchPromise: Promise<any> | null = null;
let lastFetchTime = 0;
const FETCH_COOLDOWN = 2000;

export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async ({ langId, force = false }: { langId: number; force?: boolean }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { cart: CartState };
      const now = Date.now();
      
      // Kiểm tra cooldown
      if (!force && now - lastFetchTime < FETCH_COOLDOWN && !state.cart.needsRefetch) {
        console.log("🔄 Skip fetch - trong cooldown period");
        return state.cart;
      }
      
      // Kiểm tra nếu đang fetch
      if (currentFetchPromise && !force) {
        console.log("🔄 Đang fetch, trả về promise hiện tại");
        return await currentFetchPromise;
      }
      
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("❌ No token found");
        throw new Error("No token found");
      }
      
      console.log("🔄 Fetching cart data...");
      const fetchPromise = axios.get<CartResponse>("http://localhost:8000/api/shopping/cart", {
        params: { lang_id: langId },
        headers: { Authorization: `Bearer ${token}` },
      });
      
      currentFetchPromise = fetchPromise;
      lastFetchTime = now;
      
      const response = await fetchPromise;
      console.log("✅ Cart fetched successfully");
      
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching cart:", error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    } finally {
      currentFetchPromise = null;
    }
  }
);

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ productId, quantity = 1, attributeIds, langId }: {
    productId: number;
    quantity?: number;
    attributeIds?: string[];
    langId: number;
  }, { rejectWithValue, dispatch, getState }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
      
      console.log("🛒 Adding to cart:", { productId, quantity, langId });
      
      const response = await axios.post(
        "http://localhost:8000/api/shopping/cart",
        {
          product_id: productId,
          quantity,
          lang_id: langId,
          attribute_ids: attributeIds,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      toast.success("✅ Đã thêm vào giỏ hàng!");
      
      // ✅ THÊM: Cập nhật totalItems ngay lập tức (tăng thêm quantity)
      const state = getState() as { cart: CartState };
      const newTotalItems = state.cart.totalItems + quantity;
      const newTotalPrice = state.cart.totalPrice + (response.data?.product_price || 0) * quantity;
      
      console.log(`📊 Updated totalItems: ${state.cart.totalItems} → ${newTotalItems}`);
      
      // Đánh dấu cần refetch
      dispatch(markNeedsRefetch());
      
      // ✅ THÊM: Cập nhật state ngay lập tức
      dispatch(updateCartState({
        totalItems: newTotalItems,
        totalPrice: newTotalPrice,
        lastUpdated: Date.now()
      }));
      
      return { 
        productId, 
        quantity, 
        response: response.data,
        timestamp: Date.now(),
        newTotalItems,
        newTotalPrice
      };
    } catch (error: any) {
      toast.error("❌ Không thể thêm vào giỏ hàng");
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const updateCartQuantity = createAsyncThunk(
  "cart/updateQuantity",
  async ({ id, quantity, langId }: { id: string; quantity: number; langId: number }, { rejectWithValue, dispatch, getState }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
      
      console.log("🔄 Updating cart quantity:", { id, quantity });
      
      const response = await axios.put(
        `http://localhost:8000/api/shopping/cart/${id}`,
        { quantity, lang_id: langId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // ✅ THÊM: Tính toán thay đổi quantity
      const state = getState() as { cart: CartState };
      const item = state.cart.cartItems.find(item => item.id === id);
      
      if (item) {
        const quantityDiff = quantity - item.quantity;
        const newTotalItems = state.cart.totalItems + quantityDiff;
        const newTotalPrice = state.cart.totalPrice + (item.price * quantityDiff);
        
        console.log(`📊 Quantity change: ${quantityDiff}, new totalItems: ${newTotalItems}`);
        
        // Cập nhật state ngay lập tức
        dispatch(updateCartState({
          totalItems: newTotalItems,
          totalPrice: newTotalPrice,
          lastUpdated: Date.now()
        }));
      }
      
      dispatch(markNeedsRefetch());
      
      return { 
        id, 
        quantity, 
        timestamp: Date.now(),
        itemUpdated: true
      };
    } catch (error: any) {
      toast.error("❌ Không thể cập nhật số lượng");
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const removeCartItem = createAsyncThunk(
  "cart/removeItem",
  async ({ id, langId }: { id: string; langId: number }, { rejectWithValue, dispatch, getState }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
      
      console.log("🗑️ Removing item from cart:", id);
      
      // ✅ THÊM: Lấy thông tin item trước khi xóa để tính toán
      const state = getState() as { cart: CartState };
      const item = state.cart.cartItems.find(item => item.id === id);
      
      await axios.delete(`http://localhost:8000/api/shopping/cart/${id}`, {
        params: { lang_id: langId },
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success("✅ Xóa sản phẩm thành công!");
      
      if (item) {
        // ✅ THÊM: Cập nhật totalItems ngay lập tức (giảm đi item.quantity)
        const newTotalItems = state.cart.totalItems - item.quantity;
        const newTotalPrice = state.cart.totalPrice - (item.price * item.quantity);
        
        console.log(`📊 After removal - totalItems: ${state.cart.totalItems} → ${newTotalItems}`);
        
        // Cập nhật state ngay lập tức
        dispatch(updateCartState({
          totalItems: newTotalItems,
          totalPrice: newTotalPrice,
          lastUpdated: Date.now()
        }));
      }
      
      dispatch(markNeedsRefetch());
      
      return { 
        id, 
        timestamp: Date.now(),
        itemRemoved: true
      };
    } catch (error: any) {
      toast.error("❌ Không thể xóa sản phẩm");
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const triggerCartRefetch = createAsyncThunk(
  "cart/triggerRefetch",
  async ({ langId }: { langId: number }, { dispatch }) => {
    console.log("🎯 Trigger cart refetch, langId:", langId);
    
    // Đánh dấu cần refetch
    dispatch(markNeedsRefetch());
    
    // Nếu có langId, thực hiện fetch ngay với force: true
    if (langId !== undefined) {
      console.log("🔄 Force fetching cart with langId:", langId);
      dispatch(fetchCart({ langId, force: true }));
    }
    
    return { timestamp: Date.now(), langId };
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCartError: (state) => {
      state.error = null;
    },
    clearCart: (state) => {
      state.cartItems = [];
      state.totalItems = 0;
      state.totalPrice = 0;
      state.needsRefetch = false;
      state.isRefetching = false;
    },
    resetCart: (state) => {
      state.cartItems = [];
      state.totalItems = 0;
      state.totalPrice = 0;
      state.loading = false;
      state.error = null;
      state.needsRefetch = false;
      state.isRefetching = false;
    },
    markNeedsRefetch: (state) => {
      if (!state.needsRefetch) {
        console.log("📌 Mark cart needs refetch");
        state.needsRefetch = true;
        state.lastUpdated = Date.now();
      }
    },
    clearNeedsRefetch: (state) => {
      console.log("✅ Clear cart needs refetch flag");
      state.needsRefetch = false;
    },
    setRefetching: (state, action: PayloadAction<boolean>) => {
      state.isRefetching = action.payload;
    },
    // ✅ THÊM: Reducer để cập nhật state ngay lập tức
    updateCartState: (state, action: PayloadAction<{
      totalItems?: number;
      totalPrice?: number;
      lastUpdated?: number;
    }>) => {
      if (action.payload.totalItems !== undefined) {
        state.totalItems = action.payload.totalItems;
      }
      if (action.payload.totalPrice !== undefined) {
        state.totalPrice = action.payload.totalPrice;
      }
      if (action.payload.lastUpdated !== undefined) {
        state.lastUpdated = action.payload.lastUpdated;
      }
      console.log(`📊 Cart state updated - totalItems: ${state.totalItems}, totalPrice: ${state.totalPrice}`);
    },
    // ✅ THÊM: Reducer để cập nhật badge ngay lập tức
    updateCartBadge: (state, action: PayloadAction<{
      increment?: number;
      decrement?: number;
    }>) => {
      if (action.payload.increment !== undefined) {
        state.totalItems += action.payload.increment;
        console.log(`📈 Cart badge incremented: +${action.payload.increment}, new total: ${state.totalItems}`);
      }
      if (action.payload.decrement !== undefined) {
        state.totalItems = Math.max(0, state.totalItems - action.payload.decrement);
        console.log(`📉 Cart badge decremented: -${action.payload.decrement}, new total: ${state.totalItems}`);
      }
      state.lastUpdated = Date.now();
    }
  },
  extraReducers: (builder) => {
    // fetchCart
    builder
      .addCase(fetchCart.pending, (state) => {
        if (!state.loading) {
          console.log("🔄 Cart fetch pending...");
          state.loading = true;
          state.error = null;
          state.isRefetching = true;
        }
      })
      .addCase(fetchCart.fulfilled, (state, action: PayloadAction<any>) => {
        console.log("✅ Cart fetch fulfilled");
        state.loading = false;
        state.isRefetching = false;
        
        if (action.payload && action.payload.data !== undefined) {
          state.cartItems = action.payload.data || [];
          state.totalItems = action.payload.total_items || 0;
          state.totalPrice = action.payload.total_price || 0;
        } 
        else if (action.payload && action.payload.cartItems !== undefined) {
          state.cartItems = action.payload.cartItems;
          state.totalItems = action.payload.totalItems;
          state.totalPrice = action.payload.totalPrice;
        }
        
        state.lastUpdated = Date.now();
        state.needsRefetch = false;
        console.log(`📊 Final cart state - totalItems: ${state.totalItems}, totalPrice: ${state.totalPrice}`);
      })
      .addCase(fetchCart.rejected, (state, action: PayloadAction<any>) => {
        console.error("❌ Cart fetch rejected:", action.payload);
        state.loading = false;
        state.isRefetching = false;
        state.error = action.payload?.message || "Lỗi tải giỏ hàng";
        state.needsRefetch = false;
      })
      
      // addToCart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.lastUpdated = action.payload.timestamp || Date.now();
        
        // ✅ Cập nhật totalItems từ action payload
        if (action.payload.newTotalItems !== undefined) {
          state.totalItems = action.payload.newTotalItems;
        }
        if (action.payload.newTotalPrice !== undefined) {
          state.totalPrice = action.payload.newTotalPrice;
        }
        
        console.log(`🛒 Cart add successful - totalItems: ${state.totalItems}`);
      })
      .addCase(addToCart.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload?.message || "Thêm vào giỏ hàng thất bại";
      })
      
      // updateCartQuantity
      .addCase(updateCartQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        state.loading = false;
        state.lastUpdated = action.payload.timestamp || Date.now();
        console.log("🔄 Cart quantity updated, needs refetch marked");
      })
      .addCase(updateCartQuantity.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload?.message || "Cập nhật số lượng thất bại";
      })
      
      // removeCartItem
      .addCase(removeCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.loading = false;
        state.lastUpdated = action.payload.timestamp || Date.now();
        console.log("🗑️ Cart item removed, needs refetch marked");
      })
      .addCase(removeCartItem.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload?.message || "Xóa sản phẩm thất bại";
      })
      
      // triggerCartRefetch
      .addCase(triggerCartRefetch.pending, (state) => {
        console.log("🎯 External refetch triggered");
      })
      .addCase(triggerCartRefetch.fulfilled, (state, action) => {
        state.lastUpdated = Date.now();
        console.log("✅ External refetch completed for langId:", action.payload.langId);
      });
  },
});

export const { 
  clearCartError, 
  clearCart, 
  resetCart, 
  markNeedsRefetch, 
  clearNeedsRefetch,
  setRefetching,
  updateCartState,  // ✅ Export reducer mới
  updateCartBadge   // ✅ Export reducer mới
} = cartSlice.actions;
export default cartSlice.reducer;