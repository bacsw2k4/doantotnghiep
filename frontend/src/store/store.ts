import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/auth-slice";
import cartReducer from "./cart/cart-slice"; 
import voucherReducer from "./voucher/voucher-slice"; 

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer, 
    voucher: voucherReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;