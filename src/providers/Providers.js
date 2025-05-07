'use client';

import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </AuthProvider>
  );
} 