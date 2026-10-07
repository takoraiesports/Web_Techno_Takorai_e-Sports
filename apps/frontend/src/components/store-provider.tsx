'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { type Product, type ShirtSize } from '@/lib/products';

export interface CartLine {
  product: Product;
  quantity: number;
  size?: ShirtSize;
}

interface StoreContextValue {
  cart: CartLine[];
  addToCart: (product: Product, size?: ShirtSize) => void;
  changeQuantity: (productId: string, amount: number, size?: ShirtSize) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  itemCount: number;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  useEffect(() => {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith('arena-demo-')) localStorage.removeItem(key);
    }
  }, []);
  const itemCount = cart.reduce((total, line) => total + line.quantity, 0);

  const value = useMemo(
    () => ({
      cart,
      addToCart(product: Product, size?: ShirtSize) {
        if (product.has_sizes && !size) return;
        const available = size && product.has_sizes
          ? product.variants.find((variant) => variant.size === size)?.stock ?? 0
          : product.stock;
        if (available <= 0) return;
        setCart((items) => {
          const chosenSize = size;
          const found = items.find(
            (line) => line.product.id === product.id && line.size === chosenSize
          );
          if (found && found.quantity >= available) return items;
          return found
            ? items.map((line) =>
                line.product.id === product.id && line.size === chosenSize
                  ? { ...line, quantity: line.quantity + 1 }
                  : line
              )
            : [...items, { product, quantity: 1, size: chosenSize }];
        });
      },
      changeQuantity(productId: string, amount: number, size?: ShirtSize) {
        setCart((items) =>
          items.flatMap((line) => {
            if (line.product.id !== productId || (size && line.size !== size)) return [line];
            const available = line.size && line.product.has_sizes
              ? line.product.variants.find((variant) => variant.size === line.size)?.stock ?? 0
              : line.product.stock;
            const quantity = Math.min(available, line.quantity + amount);
            return quantity > 0 ? [{ ...line, quantity }] : [];
          })
        );
      },
      cartOpen,
      setCartOpen,
      itemCount,
    }),
    [cart, cartOpen, itemCount]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used inside StoreProvider');
  return context;
}
