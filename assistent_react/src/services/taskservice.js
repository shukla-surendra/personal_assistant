import http from "../http-common";
import ConfigService from "../utils/config";

const getAll = () => {
  return http.get(`/api/v1/workspaces/${ConfigService.getDefaultWorkspace().workspace_id}/tasks?order=desc&task_type=TASK`);
};

const getAllNotes = () => {
  return http.get(`/api/v1/workspaces/${ConfigService.getDefaultWorkspace().workspace_id}/tasks?order=desc&task_type=NOTE`);
};

const getAllQuickNotes = () => {
  return http.get(`/api/v1/workspaces/${ConfigService.getDefaultWorkspace().workspace_id}/tasks?order=desc&task_type=quick_note`);
};

const getAllTimeBlocks = () => {
  return http.get(`/api/v1/workspaces/${ConfigService.getDefaultWorkspace().workspace_id}/tasks?order=desc&task_type=time_block`);
};

const get = task_id => {
  return http.get(`/api/v1/workspaces/${ConfigService.getDefaultWorkspace().workspace_id}/tasks/${task_id}`);
};

const getPostBySlug = slug => {
  return http.get(`/api/v1/workspaces/${ConfigService.getDefaultWorkspace().workspace_id}/tasks/${slug}`);
};

const create = data => {
  return http.post(`/api/v1/workspaces/${ConfigService.getDefaultWorkspace().workspace_id}/tasks`, data);
};

const update = (task_id, data) => {
  return http.put(`/api/v1/workspaces/${ConfigService.getDefaultWorkspace().workspace_id}/tasks/${task_id}`, data);
};

const remove = task_id => {
  return http.delete(`/api/v1/workspaces/${ConfigService.getDefaultWorkspace().workspace_id}/tasks/${task_id}`);
};

const removeAll = () => {
  return http.delete(`/api/v1/workspaces/${ConfigService.getDefaultWorkspace().workspace_id}/tasks`);
};

const findByTitle = title => {
  return http.get(`/api/v1/workspaces/${ConfigService.getDefaultWorkspace().workspace_id}/tasks ?title=${title}`);
};

const TaskService = {
  getAll,
  getAllNotes,
  get,
  create,
  update,
  remove,
  removeAll,
  findByTitle,
  getAllQuickNotes,
  getAllTimeBlocks,
  getPostBySlug
};

export default TaskService;