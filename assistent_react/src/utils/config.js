class ConfigService {

    setDefaultWorkspace(default_workspace) {
        // Serialize the object to JSON and save it in localStorage
        localStorage.setItem('workspace', JSON.stringify(default_workspace));
        window.location.assign('/');
    }

    removeDefaultWorkspace() {
        // Serialize the object to JSON and save it in localStorage
        localStorage.removeItem('workspace');
    }

    getDefaultWorkspace() {
        const default_workspace = {workspace_id: "default_id"}
        // Retrieve the JSON string from localStorage and parse it to an object
        const workspaceJSON = localStorage.getItem('workspace');
        try {
            return JSON.parse(workspaceJSON) || default_workspace;
        } catch (error) {
            console.error('Error parsing workspace from localStorage:', error);
            return default_workspace;
        }
    }

}

const config = new ConfigService();
export default config;