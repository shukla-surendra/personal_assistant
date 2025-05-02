import http from "../http-common";

const getMembers = (workspaceId) => http.get(`/api/v1/workspaces/${workspaceId}/members`);
const addMember = (workspaceId, email) => http.post(`/api/v1/workspaces/${workspaceId}/invite`, { email });
const removeMember = (workspaceId, userId) => http.delete(`/api/v1/workspaces/${workspaceId}/users/${userId}`);
const updateMemberRole = (workspaceId, userId, role) => http.put(`/api/v1/workspaces/${workspaceId}/users/${userId}/role`, { role });

const MemberService = {
  getMembers,
  addMember,
  removeMember,
  updateMemberRole
};

export default MemberService; 