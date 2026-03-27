// src/types/react.d.ts
import 'react';

declare module 'react' {
  interface HTMLAttributes<T> {
    'data-type'?: string;
    // Thêm các data-* khác nếu cần sau này
    'data-id'?: string | number;
    'data-test'?: string;
  }
}