// src/services/WorkspaceService.js
import http from "../http-common";

const getAll = () => http.get("/api/v1/workspaces/member-workspaces");
const getOwn = () => http.get("/api/v1/workspaces");

const WorkspaceService = {
  getAll,
  getOwn
};

export default WorkspaceService;