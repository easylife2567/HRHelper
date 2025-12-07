import { create } from 'zustand';

interface User {
    name: string;
    token: string;
}

interface AppState {
    user: User | null;
    setUser: (user: User | null) => void;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

export const useStore = create<AppState>((set) => ({
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
    setUser: (user) => {
        if (user) localStorage.setItem('user', JSON.stringify(user));
        else localStorage.removeItem('user');
        set({ user });
    },
    isSidebarOpen: true,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
