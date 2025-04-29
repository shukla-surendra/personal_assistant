import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import Config from './config';

interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    default_workspace?: {
        workspace_id: string;
        name: string;
    };
}

interface LoginResponse {
    access_token: string;
    token_type: string;
    user: User;
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
            const token = await Config.getToken();
            if (!token) return false;
            
            const decoded = jwtDecode<JwtPayload>(token);
            return decoded.exp > Date.now() / 1000;
        } catch (error) {
            console.error('Error checking auth status:', error);
            return false;
        }
    }

    async login(response: LoginResponse): Promise<void> {
        try {
            // Store the access token
            await Config.setToken(response.access_token);
            
            // Store user info
            await AsyncStorage.setItem('user_info', JSON.stringify(response.user));
            
            // Store default workspace if exists
            if (response.user.default_workspace) {
                await Config.setDefaultWorkspace(response.user.default_workspace);
            }
        } catch (error) {
            console.error('Error saving auth data:', error);
            throw error;
        }
    }

    async logout(): Promise<void> {
        try {
            await Config.setToken(null);
            await Config.setDefaultWorkspace(null);
            await AsyncStorage.removeItem('user_info');
        } catch (error) {
            console.error('Error removing auth data:', error);
            throw error;
        }
    }
}

export default new AuthService(); 