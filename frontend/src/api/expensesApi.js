import api from '../axios';

const BASE_URL = '/expenses';

const expensesApi = {
  getMyExpenses: async () => {
    const response = await api.get(`${BASE_URL}/my-expenses`);
    return response.data;
  },

  getAllExpenses: async (params) => {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  getPendingExpenses: async () => {
    const response = await api.get(`${BASE_URL}/pending`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get(`${BASE_URL}/stats`);
    return response.data;
  },

  createExpense: async (formData) => {
    const response = await api.post(BASE_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  approveExpense: async (id) => {
    const response = await api.put(`${BASE_URL}/${id}/approve`);
    return response.data;
  },

  rejectExpense: async (id, reason) => {
    const response = await api.put(`${BASE_URL}/${id}/reject`, { reason });
    return response.data;
  },

  deleteExpense: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  processReceipt: async (formData) => {
    const response = await api.post(`${BASE_URL}/process-receipt`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  updateExpense: async (id, data) => {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  exportExpenses: async () => {
    const response = await api.get(`${BASE_URL}/export`, {
      responseType: 'blob', // Important for downloading files
    });
    return response.data;
  }
};

export default expensesApi;
