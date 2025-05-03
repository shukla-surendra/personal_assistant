import axios from "axios";
import ConfigService from "./utils/config";

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

export default http;