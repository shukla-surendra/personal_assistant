import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

interface LoginResponse {
    token: string;
    user: any;
}

interface JwtPayload {
    exp: number;
    [key: string]: any;
}

const AUTH_TOKEN_KEY = '@auth_token';

class AuthService {
    async getProfile() {
        try {
            const userInfo = await AsyncStorage.getItem('user_info');
            return userInfo ? JSON.parse(userInfo) : null;
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    async loggedIn(): Promise<boolean> {
        try {
            const token = await this.getToken();
            return !!token;
        } catch (error) {
            console.error('Error checking auth status:', error);
            return false;
        }
    }

    isTokenExpired(token: string) {
        try {
            const decoded = jwtDecode<JwtPayload>(token);
            return decoded.exp < Date.now() / 1000;
        } catch (error) {
            return true;
        }
    }

    async getToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        } catch (error) {
            console.error('Error getting auth token:', error);
            return null;
        }
    }

    async login(token: string): Promise<void> {
        try {
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
        } catch (error) {
            console.error('Error saving auth token:', error);
            throw error;
        }
    }

    async logout(): Promise<void> {
        try {
            await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        } catch (error) {
            console.error('Error removing auth token:', error);
            throw error;
        }
    }
}

export default new AuthService(); 