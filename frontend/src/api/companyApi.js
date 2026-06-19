import api from '../axios';

const BASE_URL = '/company';

const companyApi = {
  getCompany: async () => {
    // Usually retrieved by user's company ID implicitly via backend scoping
    const response = await api.get(BASE_URL);
    return response.data;
  },

  updateCompany: async (data) => {
    const response = await api.put(BASE_URL, data);
    return response.data;
  },

  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post(`${BASE_URL}/upload-logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

export default companyApi;
