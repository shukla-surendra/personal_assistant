import http from "../http-common";
import ConfigService from "../utils/config";

const get = () => {
  return http.get(`/api/v1/settings/${ConfigService.getDefaultWorkspace().workspace_id}`);
};

const update = (data) => {
  return http.put(`/api/v1/settings/${ConfigService.getDefaultWorkspace().workspace_id}`, data);
};

const SettingsService = {
  get,
  update,
};

export default SettingsService; 