"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface CartItem {
  id: string;
  menu_id: string;
  vendor_id: string;
  dishName: string;
  vendorName: string;
  basePrice: number;
  headcount: number;
  baseServings: number;
  totalPrice: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => "added" | "updated" | "different-vendor";
  updateQuantity: (id: string, headcount: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  total: number;
  ready: boolean;
}

const STORAGE_KEY = "jie_bulk_order-cart-v2";

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      setItems([]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage may be unavailable in private browsing.
    }
  }, [items, ready]);

  const addToCart = (item: CartItem) => {
    const existing = items.find((current) => current.id === item.id);

    if (existing) {
      setItems((current) =>
        current.map((line) =>
          line.id === item.id ? item : line,
        ),
      );

      return "updated";
    }

    setItems((current) => [...current, item]);

    return "added";
  };

  const updateQuantity = (id: string, headcount: number) => {
    if (headcount < 1) {
      removeItem(id);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              headcount,
              totalPrice: item.basePrice * headcount,
            }
          : item,
      ),
    );
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.totalPrice, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        total,
        ready,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return context;
}