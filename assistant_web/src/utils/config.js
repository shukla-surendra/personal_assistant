class ConfigService {

    setDefaultWorkspace(default_workspace) {
        // Serialize the object to JSON and save it in localStorage
        localStorage.setItem('workspace', JSON.stringify(default_workspace));
    }

    removeDefaultWorkspace() {
        // Remove workspace from localStorage
        localStorage.removeItem('workspace');
    }

    getDefaultWorkspace() {
        // Retrieve the JSON string from localStorage and parse it to an object
        const workspaceJSON = localStorage.getItem('workspace');
        try {
            const workspace = JSON.parse(workspaceJSON);
            if (!workspace || !workspace.workspace_id) {
                throw new Error('Invalid workspace data');
            }
            return workspace;
        } catch (error) {
            console.error('Error parsing workspace from localStorage:', error);
            throw new Error('No workspace selected');
        }
    }

    // Token management methods
    getToken() {
        return localStorage.getItem('access_token');
    }

    setToken(token) {
        localStorage.setItem('access_token', token);
    }

    clearToken() {
        localStorage.removeItem('access_token');
    }

    // User ID methods
    setUserId(user_id) {
        localStorage.setItem('user_id', user_id);
    }

    getUserId() {
        const userId = localStorage.getItem('user_id');
        if (!userId) {
            throw new Error('No user ID found');
        }
        return userId;
    }

    removeUserId() {
        localStorage.removeItem('user_id');
    }
}

const config = new ConfigService();
export default config;