import http from "../http-common";
import ConfigService from "../utils/config";

const get = () => {
  return http.get(`/api/v1/workspaces/${ConfigService.getDefaultWorkspace().workspace_id}/settings`);
};

const update = (data) => {
  return http.put(`/api/v1/workspaces/${ConfigService.getDefaultWorkspace().workspace_id}/settings`, data);
};

const SettingsService = {
  get,
  update,
};

export default SettingsService; 