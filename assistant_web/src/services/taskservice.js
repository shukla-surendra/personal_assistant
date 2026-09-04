import http, { getBackendUrl } from "../http-common";
import ConfigService from "../utils/config";
import axios from "axios";

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

// No task_type filter -- a board's cards can be any type. page_size=200 is
// a pragmatic cap, not real pagination; fine for a single board's cards.
const getByBoard = (boardId) => {
  return http.get(`/api/v1/workspaces/${ConfigService.getDefaultWorkspace().workspace_id}/tasks?board_id=${boardId}&page_size=200`);
};

const get = task_id => {
  // For shared notes, we don't need authentication
  const isSharedNote = window.location.pathname.startsWith('/shared/note/');
  
  if (isSharedNote) {
    // Use the public note endpoint
    return getPublicNote(task_id);
  } else {
    // Use the authenticated http client for regular requests
    return http.get(`/api/v1/workspaces/${ConfigService.getDefaultWorkspace().workspace_id}/tasks/${task_id}`);
  }
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
  const workspace_id = ConfigService.getDefaultWorkspace().workspace_id;
  return http.delete(`/api/v1/workspaces/${workspace_id}/tasks/${task_id}`);
};

const removeAll = () => {
  return http.delete(`/api/v1/workspaces/${ConfigService.getDefaultWorkspace().workspace_id}/tasks`);
};

const findByTitle = title => {
  return http.get(`/api/v1/workspaces/${ConfigService.getDefaultWorkspace().workspace_id}/tasks ?title=${title}`);
};

const getPublicNote = task_id => {
  // Use axios for public access without authentication
  return axios.get(`${getBackendUrl()}/api/v1/public/notes/${task_id}`);
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
  getByBoard,
  getPostBySlug,
  getPublicNote
};

export default TaskService;