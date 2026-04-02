import { create } from 'zustand';

export const useCounterStore = create((set) => ({
  count: 0,
  isDark: false,
  increment: () => set((s) => ({ count: s.count + 1 })),
  toggleTheme: () => set((s) => ({ isDark: !s.isDark })),
}));