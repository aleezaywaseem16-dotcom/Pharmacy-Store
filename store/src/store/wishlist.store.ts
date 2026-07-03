import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

interface WishlistState {
  items: Product[];
  add: (product: Product) => void;
  remove: (productId: string) => void;
  toggle: (product: Product) => void;
  has: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (product) =>
        set((s) =>
          s.items.find((i) => i.id === product.id)
            ? s
            : { items: [...s.items, product] },
        ),

      remove: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      toggle: (product) => {
        const { has, add, remove } = get();
        has(product.id) ? remove(product.id) : add(product);
      },

      has: (id) => get().items.some((i) => i.id === id),

      clear: () => set({ items: [] }),
    }),
    { name: 'pharmacy-wishlist' },
  ),
);
