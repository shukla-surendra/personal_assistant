import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
    token: string | null;
    setToken: (token: string | null) => void;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    setToken: (token: string | null) => set({ token }),
    signOut: async () => {
        await AsyncStorage.removeItem('token');
        set({ token: null });
    },
})); 