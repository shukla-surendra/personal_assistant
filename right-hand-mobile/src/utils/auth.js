import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';

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

    async loggedIn() {
        try {
            const token = await this.getToken();
            return !!token && !this.isTokenExpired(token);
        } catch (error) {
            return false;
        }
    }

    isTokenExpired(token) {
        try {
            const decoded = jwtDecode(token);
            return decoded.exp < Date.now() / 1000;
        } catch (error) {
            return true;
        }
    }

    async getToken() {
        try {
            return await AsyncStorage.getItem('token');
        } catch (error) {
            return null;
        }
    }

    async login(loginResponse) {
        try {
            const { token, user } = loginResponse;
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user_info', JSON.stringify(user));
            return true;
        } catch (error) {
            console.error('Error during login:', error);
            return false;
        }
    }

    async logout() {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user_info');
            return true;
        } catch (error) {
            console.error('Error during logout:', error);
            return false;
        }
    }
}

export default new AuthService(); 