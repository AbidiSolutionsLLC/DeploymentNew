import api from '../axios';

const API_URL = '/time-logs';

const getEmployeeTimeLogs = async (date = null) => {
  const params = {};
  if (date) {
    params.date = date;
  }
  const response = await api.get(API_URL, { params });
  return response.data;
};

const createTimeLog = async (timeLogData) => {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  };
  const response = await api.post(API_URL, timeLogData, config);
  return response.data;
};

const updateTimeLog = async (id, updates) => {
  const response = await api.put(`${API_URL}/${id}`, updates);
  return response.data;
};

const deleteTimeLog = async (id) => {
  const response = await api.delete(`${API_URL}/${id}`);
  return response.data;
};

const downloadAttachment = async (logId, attachmentId) => {
  const response = await api.get(`/time-logs/${logId}/attachments/${attachmentId}/download`, {
    responseType: 'blob'
  });
  return response.data;
}

export default {
  getEmployeeTimeLogs,
  createTimeLog,
  updateTimeLog,
  deleteTimeLog,
  downloadAttachment
};