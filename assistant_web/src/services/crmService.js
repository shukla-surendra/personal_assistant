import axios from 'axios';
import config from '../config.json';

const CRM_API = `${config.API_BASE_URL}/${config.API_VERSION}/workspaces`;

// Contact APIs
export const getContacts = async (workspaceId) => {
    const response = await axios.get(`${CRM_API}/${workspaceId}/contacts`);
    return response.data;
};

export const createContact = async (workspaceId, contactData) => {
    const response = await axios.post(`${CRM_API}/${workspaceId}/contacts`, contactData);
    return response.data;
};

export const getContact = async (workspaceId, contactId) => {
    const response = await axios.get(`${CRM_API}/${workspaceId}/contacts/${contactId}`);
    return response.data;
};

export const getWorkspaceContacts = async (workspaceId) => {
    const response = await axios.get(`${CRM_API}/${workspaceId}/contacts`);
    return response.data;
};

export const updateContact = async (workspaceId, contactId, contactData) => {
    const response = await axios.put(`${CRM_API}/${workspaceId}/contacts/${contactId}`, contactData);
    return response.data;
};

export const deleteContact = async (workspaceId, contactId) => {
    const response = await axios.delete(`${CRM_API}/${workspaceId}/contacts/${contactId}`);
    return response.data;
};

// Deal APIs
export const getDeals = async (workspaceId) => {
    const response = await axios.get(`${CRM_API}/${workspaceId}/deals`);
    return response.data;
};

export const createDeal = async (workspaceId, dealData) => {
    const response = await axios.post(`${CRM_API}/${workspaceId}/deals`, dealData);
    return response.data;
};

export const getDeal = async (workspaceId, dealId) => {
    const response = await axios.get(`${CRM_API}/${workspaceId}/deals/${dealId}`);
    return response.data;
};

export const getContactDeals = async (workspaceId, contactId) => {
    const response = await axios.get(`${CRM_API}/${workspaceId}/contacts/${contactId}/deals`);
    return response.data;
};

export const updateDeal = async (workspaceId, dealId, dealData) => {
    const response = await axios.put(`${CRM_API}/${workspaceId}/deals/${dealId}`, dealData);
    return response.data;
};

export const deleteDeal = async (workspaceId, dealId) => {
    const response = await axios.delete(`${CRM_API}/${workspaceId}/deals/${dealId}`);
    return response.data;
};

// Activity APIs
export const createContactActivity = async (workspaceId, contactId, activityData) => {
    const response = await axios.post(`${CRM_API}/${workspaceId}/contacts/${contactId}/activities`, activityData);
    return response.data;
};

export const getContactActivities = async (workspaceId, contactId) => {
    const response = await axios.get(`${CRM_API}/${workspaceId}/contacts/${contactId}/activities`);
    return response.data;
};

export const createDealActivity = async (workspaceId, dealId, activityData) => {
    const response = await axios.post(`${CRM_API}/${workspaceId}/deals/${dealId}/activities`, activityData);
    return response.data;
};

export const getDealActivities = async (workspaceId, dealId) => {
    const response = await axios.get(`${CRM_API}/${workspaceId}/deals/${dealId}/activities`);
    return response.data;
};

export const getActivities = async (workspaceId) => {
    const response = await axios.get(`${CRM_API}/${workspaceId}/activities`);
    return response.data;
};

export const createActivity = async (workspaceId, activityData) => {
    const response = await axios.post(`${CRM_API}/${workspaceId}/activities`, activityData);
    return response.data;
};

export const updateActivity = async (workspaceId, activityId, activityData) => {
    const response = await axios.put(`${CRM_API}/${workspaceId}/activities/${activityId}`, activityData);
    return response.data;
};

export const deleteActivity = async (workspaceId, activityId) => {
    const response = await axios.delete(`${CRM_API}/${workspaceId}/activities/${activityId}`);
    return response.data;
}; 