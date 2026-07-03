import { create } from 'zustand';
import { Cart } from '@/types';
import api, { showError } from '@/lib/api';
import { toast } from 'sonner';

interface CartState {
  cart: Cart | null;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  cart: null,
  loading: false,

  fetchCart: async () => {
    try {
      set({ loading: true });
      const { data } = await api.get('/cart');
      set({ cart: data.data });
    } catch {
      // not logged in — cart stays null
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (productId, quantity = 1) => {
    try {
      await api.post('/cart/items', { productId, quantity });
      await get().fetchCart();
      toast.success('Added to cart');
    } catch (e) {
      showError(e);
    }
  },

  updateItem: async (itemId, quantity) => {
    try {
      await api.patch(`/cart/items/${itemId}`, { quantity });
      await get().fetchCart();
    } catch (e) {
      showError(e);
    }
  },

  removeItem: async (itemId) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      await get().fetchCart();
      toast.success('Removed from cart');
    } catch (e) {
      showError(e);
    }
  },

  clearCart: async () => {
    try {
      await api.delete('/cart');
      set({ cart: null });
    } catch (e) {
      showError(e);
    }
  },

  itemCount: () =>
    get().cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0,

  total: () =>
    get().cart?.items.reduce((sum, i) => {
      const price = i.product.discountedPrice ?? i.product.price;
      return sum + price * i.quantity;
    }, 0) ?? 0,
}));
