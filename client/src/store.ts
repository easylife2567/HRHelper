import { create } from 'zustand';

interface User {
    name: string;
    token: string;
}

import axios from 'axios';

interface AppState {
    user: User | null;
    setUser: (user: User | null) => void;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;

    // Talent Cache
    talentList: any[];
    loadingTalents: boolean;
    fetchTalents: (force?: boolean) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
    setUser: (user) => {
        if (user) localStorage.setItem('user', JSON.stringify(user));
        else localStorage.removeItem('user');
        set({ user });
    },
    isSidebarOpen: true,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

    talentList: [],
    loadingTalents: false,
    fetchTalents: async (force = false) => {
        const { talentList, loadingTalents } = get();
        if (!force && talentList.length > 0) return;
        if (loadingTalents) return;

        set({ loadingTalents: true });
        try {
            const res = await axios.get('http://localhost:3000/api/talent/list');
            const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
            set({ talentList: list, loadingTalents: false });
        } catch (error) {
            console.error('Failed to fetch talents', error);
            set({ loadingTalents: false });
        }
    },
}));
