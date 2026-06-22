import api from '../axios';

const BASE_URL = '/tickets';

const ticketsApi = {
 getMyTickets: async (params) => {
 const response = await api.get(`${BASE_URL}/my-tickets`, { params });
 return response.data; // { success: true, data: [...], pagination: {...} }
 },

 getAllTickets: async (params) => {
 const response = await api.get(`${BASE_URL}/all`, { params });
 return response.data; // backend currently returns array directly or wrapped based on controller
 },

 getTicketById: async (id) => {
 const response = await api.get(`${BASE_URL}/${id}`);
 return response.data;
 },

 createTicket: async (formData) => {
 // formData for multipart/form-data support
 const response = await api.post(BASE_URL, formData, {
 headers: {
 'Content-Type': 'multipart/form-data'
 }
 });
 return response.data;
 },

 updateTicket: async (id, data) => {
 const response = await api.put(`${BASE_URL}/${id}`, data);
 return response.data;
 },

 deleteTicket: async (id) => {
 const response = await api.delete(`${BASE_URL}/${id}`);
 return response.data;
 },

 updateStatus: async (id, status) => {
 const response = await api.patch(`${BASE_URL}/${id}/status`, { status });
 return response.data;
 },

 updatePriority: async (id, priority) => {
 const response = await api.patch(`${BASE_URL}/${id}/priority`, { priority });
 return response.data;
 },

 assignTicket: async (id, assignedTo) => {
 const response = await api.patch(`${BASE_URL}/${id}/assign`, { assignedTo });
 return response.data;
 },

 addResponse: async (id, data) => {
 const response = await api.post(`${BASE_URL}/${id}/response`, data);
 return response.data;
 }
};

export default ticketsApi;
