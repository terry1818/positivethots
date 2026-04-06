import { create } from 'zustand';

interface AdminViewState {
  adminViewMode: 'admin' | 'user';
  setAdminViewMode: (mode: 'admin' | 'user') => void;
  toggleAdminViewMode: () => void;
}

export const useAdminViewStore = create<AdminViewState>()((set) => ({
  adminViewMode: 'admin',
  setAdminViewMode: (mode) => set({ adminViewMode: mode }),
  toggleAdminViewMode: () =>
    set((state) => ({
      adminViewMode: state.adminViewMode === 'admin' ? 'user' : 'admin',
    })),
}));
