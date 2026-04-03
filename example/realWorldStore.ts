import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';
type UserRole = 'admin' | 'editor' | 'viewer';

interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
}

interface AppState {
  theme: Theme;
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  notifications: Array<{ id: number; message: string; isRead: boolean }>;
  sidebarCollapsed: boolean;

  setTheme: (theme: Theme) => void;
  login: (user: UserProfile) => Promise<void>;
  logout: () => void;
  addNotification: (msg: string) => void;
  toggleSidebar: () => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'system',
  user: null,
  isLoading: false,
  error: null,
  notifications: [],
  sidebarCollapsed: false,

  setTheme: (theme) => set({ theme }),
  login: async (user) => {
    set({ isLoading: true, error: null });
    // имитация API
    set({ user, isLoading: false });
  },
  logout: () => set({ user: null, notifications: [], error: null, theme: 'system' }),
  addNotification: (msg) => set((state) => ({
    notifications: [...state.notifications, { id: Date.now(), message: msg, isRead: false }]
  })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  clearError: () => set({ error: null })
}));