import axios, { AxiosError } from 'axios';
import Auth from '../utils/auth';
import Config from '../utils/config';

const getBackendUrl = () => {
    if (process.env.EXPO_PUBLIC_ENV === 'production') {
        return process.env.EXPO_PUBLIC_BACKEND_PROD_URL;
    }
    return process.env.EXPO_PUBLIC_BACKEND_DEV_URL || 'http://192.168.29.93:8000';
};

const api = axios.create({
    baseURL: getBackendUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds timeout
});

// Add request interceptor to add auth token and workspace
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await Auth.getToken();
            const workspace = await Config.getDefaultWorkspace();

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            if (workspace?.workspace_id) {
                config.headers['X-Workspace-ID'] = workspace.workspace_id;
            }
        } catch (error) {
            console.error('Error in request interceptor:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('API Error Response:', error.response.data);
            
            if (error.response.status === 401) {
                // Handle unauthorized access
                await Auth.logout();
                // You might want to navigate to login screen here
            }
        } else if (error.request) {
            // The request was made but no response was received
            console.error('API Error Request:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('API Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api; 