import api from './api';

export interface Notification {
  notification_id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  entity_id?: string;
  entity_type?: string;
  read: boolean;
  properties?: Record<string, any>;
}

export const getNotifications = async (workspaceId: string): Promise<Notification[]> => {
  const res = await api.get(`/api/v1/workspaces/${workspaceId}/notifications`);
  return res.data;
};

export const getNotification = async (workspaceId: string, notificationId: string): Promise<Notification> => {
  const res = await api.get(`/api/v1/workspaces/${workspaceId}/notifications/${notificationId}`);
  return res.data;
};

export const markNotificationRead = async (workspaceId: string, notificationId: string): Promise<Notification> => {
  const res = await api.put(`/api/v1/workspaces/${workspaceId}/notifications/${notificationId}`, { read: true });
  return res.data;
};

export const deleteNotification = async (workspaceId: string, notificationId: string): Promise<void> => {
  await api.delete(`/api/v1/workspaces/${workspaceId}/notifications/${notificationId}`);
}; 