import api from './api';

export const getChats = async (workspaceId) => {
    const response = await api.get(`/api/v1/chat/workspace/${workspaceId}`);
    return response.data;
};

export const createChat = async (chatData) => {
    const response = await api.post('/api/v1/chat', chatData);
    return response.data;
};

export const getMessages = async (chatId) => {
    const response = await api.get(`/api/v1/chat/${chatId}/messages`);
    return response.data;
};

export const createMessage = async (chatId, messageData) => {
    const response = await api.post(`/api/v1/chat/${chatId}/messages`, messageData);
    return response.data;
};

export const createCompletion = async (chatId, completionData) => {
    const response = await api.post(`/api/v1/chat/${chatId}/completion`, completionData);
    return response.data;
};

export const updateChat = async (chatId, chatData) => {
    const response = await api.put(`/api/v1/chat/${chatId}`, chatData);
    return response.data;
};

export const deleteChat = async (chatId) => {
    const response = await api.delete(`/api/v1/chat/${chatId}`);
    return response.data;
}; 