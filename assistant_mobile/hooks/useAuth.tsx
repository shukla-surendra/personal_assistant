import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';

interface AuthContextType {
    isAuthenticated: boolean;
    signIn: (token: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            setIsAuthenticated(!!token);
        } catch (error) {
            console.error('Error checking auth status:', error);
            setIsAuthenticated(false);
        }
    };

    const signIn = async (token: string) => {
        try {
            await AsyncStorage.setItem('authToken', token);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Error signing in:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await AsyncStorage.removeItem('authToken');
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const router = useRouter();
    const { signOut: storeSignOut } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    const signOut = useCallback(async () => {
        try {
            setIsLoading(true);
            await storeSignOut();
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setIsLoading(false);
        }
    }, [router, storeSignOut]);

    return {
        signOut,
        isLoading,
    };
} 