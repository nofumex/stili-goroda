import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  ids: string[];
  toggle: (productId: string) => void;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (productId: string) => {
        const currentIds = get().ids;
        const exists = currentIds.includes(productId);
        // Используем Set для гарантии уникальности
        const newIds = exists 
          ? currentIds.filter(id => id !== productId)
          : Array.from(new Set([...currentIds, productId]));
        set({ ids: newIds });
      },
      add: (productId: string) => {
        const currentIds = get().ids;
        if (!currentIds.includes(productId)) {
          // Используем Set для гарантии уникальности
          set({ ids: Array.from(new Set([...currentIds, productId])) });
        }
      },
      remove: (productId: string) => {
        set({ ids: get().ids.filter(id => id !== productId) });
      },
      has: (productId: string) => get().ids.includes(productId),
    }),
    {
      name: 'favorites-storage',
      partialize: (state) => ({ ids: state.ids }),
      // Дедупликация при загрузке из localStorage
      onRehydrateStorage: () => (state) => {
        if (state && state.ids) {
          state.ids = Array.from(new Set(state.ids));
        }
      },
    }
  )
);








