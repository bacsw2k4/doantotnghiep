import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { User, UserFormData, LoginFormData } from "@/services/entity";

interface Address {
  id: number;
  name: string;
  fullName: string;
  phone: string;
  address: string;
  city: string | null;
  country: string | null;
  email: string | null;
  desc: string | null;
  isDefault: boolean;
}

interface OrderDetail {
  productId: number;
  productName: string;
  price: string;
  volume: number;
  totalPrice: string;
  image: string | null;
  attributes: { id: number; name: string }[];
}

interface Order {
  id: number;
  orderCode: string;
  date: string;
  total: string;
  status: string;
  items: number;
  image: string | null;
  details: OrderDetail[];
}

interface AdminUserState {
  isLoading: boolean;
  user: User;
  isAuthenticated: boolean;
  error: string | null;
  addresses: Address[];
  orders: Order[];
}

const NullUser: User = {
  userId: "",
  fullName: "",
  email: "",
  phone: "",
  address: "",
  avatar: "",
  role: { id: 0, name: "" },
  status: "inactive",
  joinDate: "",
  totalOrders: 0,
  totalSpent: "0",
};

const initialState: AdminUserState = {
  isLoading: false,
  user: NullUser,
  isAuthenticated: false,
  error: null,
  addresses: [],
  orders: [],
};

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (formData: UserFormData, { rejectWithValue }) => {
    try {
      const result = await axios.post("http://localhost:8000/api/auth/register", formData, {
        headers: { "Content-Type": "application/json" },
      });
      localStorage.setItem("token", result.data.token);
      return result.data;
    } catch (error: any) {
      console.error("Register error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (formData: LoginFormData, { rejectWithValue }) => {
    try {
      const result = await axios.post("http://localhost:8000/api/auth/login", formData, {
        headers: { "Content-Type": "application/json" },
      });
      localStorage.setItem("token", result.data.token);
      return result.data;
    } catch (error: any) {
      console.error("Login error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/auth/logout",
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      localStorage.removeItem("token");
      return response.data;
    } catch (error: any) {
      console.error("Logout error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
      const response = await axios.get("http://localhost:8000/api/auth/check-auth", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getProfile = createAsyncThunk(
  "auth/getProfile",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
      const response = await axios.get("http://localhost:8000/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      console.error("Get profile error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (formData: Partial<User>, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
      const response = await axios.put("http://localhost:8000/api/auth/profile", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error: any) {
      console.error("Update profile error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  "auth/uploadAvatar",
  async (file: File, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await axios.post("http://localhost:8000/api/auth/upload-avatar", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("Upload avatar error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getShippingAddresses = createAsyncThunk(
  "auth/getShippingAddresses",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
      const response = await axios.get("http://localhost:8000/api/auth/shipping-addresses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      console.error("Get shipping addresses error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const addShippingAddress = createAsyncThunk(
  "auth/addShippingAddress",
  async (address: Partial<Address>, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
      const response = await axios.post("http://localhost:8000/api/auth/shipping-addresses", address, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error: any) {
      console.error("Add shipping address error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const updateShippingAddress = createAsyncThunk(
  "auth/updateShippingAddress",
  async ({ id, address }: { id: number; address: Partial<Address> }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
      const response = await axios.put(`http://localhost:8000/api/auth/shipping-addresses/${id}`, address, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error: any) {
      console.error("Update shipping address error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const deleteShippingAddress = createAsyncThunk(
  "auth/deleteShippingAddress",
  async (id: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
      const response = await axios.delete(`http://localhost:8000/api/auth/shipping-addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { id, ...response.data };
    } catch (error: any) {
      console.error("Delete shipping address error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getOrders = createAsyncThunk(
  "auth/getOrders",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
      const response = await axios.get("http://localhost:8000/api/auth/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      console.error("Get orders error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const AdminAuthSlice = createSlice({
  name: "authSlice",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isAuthenticated = action.payload.success;
        state.user = action.payload.success ? action.payload.user : NullUser;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = NullUser;
        state.error = action.payload?.message || "Đăng ký thất bại";
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isAuthenticated = action.payload.success;
        state.user = action.payload.success ? action.payload.user : NullUser;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = NullUser;
        state.error = action.payload?.message || "Đăng nhập thất bại";
      })
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isAuthenticated = action.payload.success;
        state.user = action.payload.success ? action.payload.user : NullUser;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = NullUser;
        state.error = action.payload?.message || "Kiểm tra xác thực thất bại";
        localStorage.removeItem("token");
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = NullUser;
        state.addresses = [];
        state.orders = [];
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = NullUser;
        state.addresses = [];
        state.orders = [];
        state.error = action.payload?.message || "Đăng xuất thất bại";
      })
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isAuthenticated = action.payload.success;
        state.user = action.payload.success ? action.payload.user : NullUser;
        state.error = null;
      })
      .addCase(getProfile.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = NullUser;
        state.addresses = [];
        state.orders = [];
        state.error = action.payload?.message || "Không thể tải thông tin cá nhân";
        localStorage.removeItem("token");
      })
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.user = action.payload.success ? action.payload.user : state.user;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Cập nhật thông tin thất bại";
      })
      .addCase(uploadAvatar.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.success) {
          state.user.avatar = action.payload.avatar;
        }
        state.error = null;
      })
      .addCase(uploadAvatar.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Cập nhật avatar thất bại";
      })
      .addCase(getShippingAddresses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getShippingAddresses.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.addresses = action.payload.success ? action.payload.addresses : [];
        state.error = null;
      })
      .addCase(getShippingAddresses.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Không thể tải danh sách địa chỉ";
      })
      .addCase(addShippingAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addShippingAddress.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.success) {
          state.addresses = [...state.addresses, action.payload.address];
        }
        state.error = null;
      })
      .addCase(addShippingAddress.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Thêm địa chỉ thất bại";
      })
      .addCase(updateShippingAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateShippingAddress.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.success) {
          state.addresses = state.addresses.map((addr) =>
            addr.id === action.payload.address.id ? action.payload.address : addr
          );
        }
        state.error = null;
      })
      .addCase(updateShippingAddress.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Cập nhật địa chỉ thất bại";
      })
      .addCase(deleteShippingAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteShippingAddress.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        if (action.payload.success) {
          state.addresses = state.addresses.filter((addr) => addr.id !== action.payload.id);
        }
        state.error = null;
      })
      .addCase(deleteShippingAddress.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Xóa địa chỉ thất bại";
      })
      .addCase(getOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getOrders.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.orders = action.payload.success ? action.payload.orders : [];
        state.error = null;
      })
      .addCase(getOrders.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Không thể tải danh sách đơn hàng";
      });
  },
});

export const { clearError } = AdminAuthSlice.actions;
export default AdminAuthSlice.reducer;