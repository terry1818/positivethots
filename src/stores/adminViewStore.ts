import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AdminViewState {
  adminViewMode: 'admin' | 'user';
  setAdminViewMode: (mode: 'admin' | 'user') => void;
  toggleAdminViewMode: () => void;
}

export const useAdminViewStore = create<AdminViewState>()(
  persist(
    (set) => ({
      adminViewMode: 'admin',
      setAdminViewMode: (mode) => set({ adminViewMode: mode }),
      toggleAdminViewMode: () =>
        set((state) => ({
          adminViewMode: state.adminViewMode === 'admin' ? 'user' : 'admin',
        })),
    }),
    {
      name: 'pt-admin-view',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
