import axios from "axios";
import ConfigService from "./utils/config";
import auth from "./utils/auth";

const getBackendUrl = () => {
  return "http://127.0.0.1:8000";
};

// Get access token and workspace from localStorage
const access_token = localStorage.getItem('access_token');
let workspace = null;
try {
  workspace = ConfigService.getDefaultWorkspace();
} catch (error) {
  console.warn('No workspace selected:', error);
}

// Create axios instance with default config
const http = axios.create({
  baseURL: getBackendUrl(),
  headers: {
    "Content-type": "application/json",
    ...(access_token && { Authorization: `Bearer ${access_token}` }),
    ...(workspace?.workspace_id && { "Workspace-Id": workspace.workspace_id })
  }
});

// Add response interceptor to handle errors
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle expired signature error
      if (error.response.status === 403 && 
          error.response.data?.detail === "Signature has expired") {
        // Force logout
        auth.logout();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default http;