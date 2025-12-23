import { create } from 'zustand';

interface AdminStore {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

// Simple password for demo - in production, this would be server-side
const ADMIN_PASSWORD = 'tlv-admin-2024';

export const useAdminStore = create<AdminStore>((set) => ({
  isAuthenticated: false,

  login: (password: string) => {
    if (password === ADMIN_PASSWORD) {
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ isAuthenticated: false });
  },
}));
