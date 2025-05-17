import axios from 'axios';
import config from '../config.json';

const CRM_API = `${config.API_BASE_URL}/api/v1/crm`;

// Contact APIs
export const getContacts = async (workspaceId) => {
    const response = await axios.get(`${CRM_API}/workspaces/${workspaceId}/contacts`);
    return response.data;
};

export const createContact = async (contactData) => {
    const response = await axios.post(`${CRM_API}/contacts`, contactData);
    return response.data;
};

export const getContact = async (contactId) => {
    const response = await axios.get(`${CRM_API}/contacts/${contactId}`);
    return response.data;
};

export const getWorkspaceContacts = async (workspaceId) => {
    const response = await axios.get(`${CRM_API}/workspaces/${workspaceId}/contacts`);
    return response.data;
};

export const updateContact = async (contactId, contactData) => {
    const response = await axios.put(`${CRM_API}/contacts/${contactId}`, contactData);
    return response.data;
};

export const deleteContact = async (contactId) => {
    const response = await axios.delete(`${CRM_API}/contacts/${contactId}`);
    return response.data;
};

// Deal APIs
export const getDeals = async (workspaceId) => {
    const response = await axios.get(`${CRM_API}/workspaces/${workspaceId}/deals`);
    return response.data;
};

export const createDeal = async (dealData) => {
    const response = await axios.post(`${CRM_API}/deals`, dealData);
    return response.data;
};

export const getDeal = async (dealId) => {
    const response = await axios.get(`${CRM_API}/deals/${dealId}`);
    return response.data;
};

export const getContactDeals = async (contactId) => {
    const response = await axios.get(`${CRM_API}/contacts/${contactId}/deals`);
    return response.data;
};

export const updateDeal = async (dealId, dealData) => {
    const response = await axios.put(`${CRM_API}/deals/${dealId}`, dealData);
    return response.data;
};

export const deleteDeal = async (dealId) => {
    const response = await axios.delete(`${CRM_API}/deals/${dealId}`);
    return response.data;
};

// Activity APIs
export const createContactActivity = async (contactId, activityData) => {
    const response = await axios.post(`${CRM_API}/contacts/${contactId}/activities`, activityData);
    return response.data;
};

export const getContactActivities = async (contactId) => {
    const response = await axios.get(`${CRM_API}/contacts/${contactId}/activities`);
    return response.data;
};

export const createDealActivity = async (dealId, activityData) => {
    const response = await axios.post(`${CRM_API}/deals/${dealId}/activities`, activityData);
    return response.data;
};

export const getDealActivities = async (dealId) => {
    const response = await axios.get(`${CRM_API}/deals/${dealId}/activities`);
    return response.data;
};

export const getActivities = async (workspaceId) => {
    const response = await axios.get(`${CRM_API}/workspaces/${workspaceId}/activities`);
    return response.data;
};

export const createActivity = async (activityData) => {
    const response = await axios.post(`${CRM_API}/activities`, activityData);
    return response.data;
};

export const updateActivity = async (activityId, activityData) => {
    const response = await axios.put(`${CRM_API}/activities/${activityId}`, activityData);
    return response.data;
};

export const deleteActivity = async (activityId) => {
    const response = await axios.delete(`${CRM_API}/activities/${activityId}`);
    return response.data;
}; 