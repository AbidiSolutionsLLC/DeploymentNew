import api from '../axios';

const authApi = {
 login: async (credentials) => {
 const response = await api.post('/auth/login', credentials);
 return response.data;
 },
 
 verifyOtp: async (data) => {
 const response = await api.post('/auth/verify-otp', data);
 return response.data;
 },
 
 resendOtp: async (data) => {
 const response = await api.post('/auth/resend-otp', data);
 return response.data;
 },

 forgotPassword: async (data) => {
 const response = await api.post('/auth/forgot-password', data);
 return response.data;
 },

 resetPassword: async (token, data) => {
 const response = await api.post(`/auth/reset-password/${token}`, data);
 return response.data;
 },
 
 registerCompany: async (data) => {
 const response = await api.post('/auth/register-company', data);
 return response.data;
 }
};

export default authApi;
