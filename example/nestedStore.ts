import { create } from 'zustand';

interface Address {
  city: string;
  street: string;
  zip: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  address: Address | null; // вложенный объект + null
  tags: string[];          // массив примитивов
}

interface AppState {
  user: UserProfile;       // вложенный объект (не null!)
  settings: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
  isLoading: boolean;
  
  updateUser: (name: string) => void;
  fetchUser: () => Promise<void>;
}

export const useNestedStore = create<AppState>((set) => ({
  user: { 
    id: '123', 
    name: 'John', 
    email: 'john@example.com', 
    address: { city: 'NYC', street: '5th Ave', zip: '10001' }, 
    tags: ['admin', 'verified'] 
  },
  settings: { theme: 'dark', notifications: true },
  isLoading: false,
  updateUser: (name) => set((state) => ({ user: { ...state.user, name } })),
  fetchUser: async () => { /* api call */ },
}));