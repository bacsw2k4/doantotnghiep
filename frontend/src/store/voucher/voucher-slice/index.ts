import { createSlice, current, type PayloadAction } from '@reduxjs/toolkit';

interface VoucherState {
  code: string | null;
  discount: number;
  discountPercent: number;
  type: 'percentage' | 'fixed' | null;
  minMoney: number;
}

const initialState: VoucherState = {
  code: null,
  discount: 0,
  discountPercent: 0,
  type: null,
  minMoney: 0,
};

const voucherSlice = createSlice({
  name: 'voucher',
  initialState,
  reducers: {
    applyVoucher: (state, action: PayloadAction<{
      code: string;
      discount: number;
      discountPercent?: number;
      type?: 'percentage' | 'fixed';
      minMoney?: number;
    }>) => {
      state.code = action.payload.code;
      state.discount = action.payload.discount;
      state.discountPercent = action.payload.discountPercent || 0;
      state.type = action.payload.type || null;
      state.minMoney = action.payload.minMoney || 0;
    },
    clearVoucher: (state) => {
      state.code = null;
      state.discount = 0;
      state.discountPercent = 0;
      state.type = null;
      state.minMoney = 0;
    },
  },
});

export const { applyVoucher, clearVoucher } = voucherSlice.actions;
export default voucherSlice.reducer;