import api from '../axios';

const BASE_URL = '/leaves';

const leavesApi = {
 // Get all leaves for the current user
 getMyLeaves: async (params) => {
 const response = await api.get(BASE_URL, { params });
 return response.data;
 },

 // Get leave balance for the current user
 getLeaveBalance: async () => {
 const response = await api.get(`${BASE_URL}/my-balance`);
 return response.data;
 },

 // Get team leaves (for managers/admins)
 getTeamLeaves: async (params) => {
 const response = await api.get(`${BASE_URL}/team`, { params });
 return response.data;
 },

 // Get all leaves (for HR/Admins)
 getAllLeaves: async (params) => {
 const response = await api.get('/getAllLeaves', { params });
 return response.data;
 },

 // Get leave by ID
 getLeaveById: async (id) => {
 const response = await api.get(`${BASE_URL}/${id}`);
 return response.data;
 },

 // Create a new leave request
 createLeave: async (data) => {
 const response = await api.post(BASE_URL, data);
 return response.data;
 },

 // Update a leave request
 updateLeave: async (id, data) => {
 const response = await api.put(`${BASE_URL}/${id}`, data);
 return response.data;
 },

 // Delete a leave request
 deleteLeave: async (id) => {
 const response = await api.delete(`${BASE_URL}/${id}`);
 return response.data;
 },

 // Update leave status (Approve/Reject)
 updateLeaveStatus: async (id, data) => {
 const response = await api.put(`${BASE_URL}/${id}/status`, data);
 return response.data;
 },

 // Bulk update leave statuses
 bulkUpdateStatus: async (ids, status) => {
 const response = await api.patch(`${BASE_URL}/bulk-status`, { ids, status });
 return response.data;
 },

 // Export leaves
 exportLeaves: async () => {
 const response = await api.get(`${BASE_URL}/export`, {
 responseType: 'blob'
 });
 return response.data;
 },

 // Leave responses
 getLeaveResponses: async (id) => {
 const response = await api.get(`${BASE_URL}/${id}/responses`);
 return response.data;
 },

 addLeaveResponse: async (id, data) => {
 const response = await api.post(`${BASE_URL}/${id}/responses`, data);
 return response.data;
 }
};

export default leavesApi;
