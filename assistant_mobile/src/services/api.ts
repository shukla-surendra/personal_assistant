import axios from 'axios';
import { BASE_URL } from '../utils/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to add auth token
api.interceptors.request.use(async (config) => {
    try {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    } catch (error) {
        return Promise.reject(error);
    }
});

// Add response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized error
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('user_info');
        }
        return Promise.reject(error);
    }
);

export default api; 