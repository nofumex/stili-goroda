import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '@/types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product | any, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  getItemQuantity: (productId: string, variantId?: string, selectedColor?: string, selectedSize?: string) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1) => {
        const items = get().items;
        const variantId = (product as any).variantId;
        const selectedColor = (product as any).selectedColor;
        const selectedSize = (product as any).selectedSize;
        
        // Create unique key for cart item (product + variant)
        const itemKey = `${product.id}-${variantId || 'default'}-${selectedColor || ''}-${selectedSize || ''}`;
        
        const existingItem = items.find(item => 
          item.productId === product.id && 
          item.variantId === variantId &&
          item.selectedColor === selectedColor &&
          item.selectedSize === selectedSize
        );

        if (existingItem) {
          set({
            items: items.map(item =>
              item.id === existingItem.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          const newItem: CartItem = {
            id: `cart-${itemKey}-${Date.now()}`,
            productId: product.id,
            variantId,
            quantity,
            price: Number(product.price),
            product,
            selectedColor,
            selectedSize,
          };

          set({
            items: [...items, newItem],
          });
        }
      },

      removeItem: (itemId) => {
        set({
          items: get().items.filter(item => item.id !== itemId),
        });
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set({
          items: get().items.map(item =>
            item.id === itemId
              ? { ...item, quantity }
              : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      toggleCart: () => {
        set({ isOpen: !get().isOpen });
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          return total + (item.price * item.quantity);
        }, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getItemQuantity: (productId, variantId?, selectedColor?, selectedSize?) => {
        const item = get().items.find(item => 
          item.productId === productId && 
          item.variantId === variantId &&
          item.selectedColor === selectedColor &&
          item.selectedSize === selectedSize
        );
        return item ? item.quantity : 0;
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);


