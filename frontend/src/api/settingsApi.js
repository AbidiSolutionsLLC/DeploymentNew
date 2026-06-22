import api from '../axios';

const settingsApi = {
 updateProfile: async (data) => {
 const response = await api.put('/users/profile', data);
 return response.data;
 },

 updateSettings: async (data) => {
 const response = await api.put('/users/settings', data);
 return response.data;
 },

 uploadAvatar: async (userId, file) => {
 const formData = new FormData();
 formData.append('avatar', file);
 const response = await api.post(`/users/${userId}/upload-avatar`, formData, {
 headers: { 'Content-Type': 'multipart/form-data' }
 });
 return response.data;
 },

 uploadCover: async (userId, file) => {
 const formData = new FormData();
 formData.append('coverImage', file);
 const response = await api.post(`/users/${userId}/upload-cover`, formData, {
 headers: { 'Content-Type': 'multipart/form-data' }
 });
 return response.data;
 }
};

export default settingsApi;
