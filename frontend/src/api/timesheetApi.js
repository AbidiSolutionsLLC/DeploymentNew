import api from '../axios';

const API_URL = '/timesheets';

const getEmployeeTimesheets = async (month, year) => {
  const response = await api.get(API_URL, { 
    params: { month, year } 
  });
  return response.data;
};

// New function for weekly timesheets
const getWeeklyTimesheets = async (weekStart) => {
  const response = await api.get(`${API_URL}/weekly`, {
    params: { weekStart }
  });
  return response.data;
};

const createTimesheet = async (timesheetData) => {
  const response = await api.post(API_URL, timesheetData);
  return response.data;
};

const getTimesheetById = async (id) => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

const getAllTimesheets = async (month, year) => {
  const response = await api.get(`${API_URL}/all`, {
    params: { month, year }
  });
  return response.data;
};

const updateTimesheetStatus = async (id, updateData) => {
  const response = await api.put(`${API_URL}/${id}/status`, updateData);
  return response.data;
};

const downloadAttachment = async (timesheetId, attachmentId) => {
  const response = await api.get(`/timesheets/${timesheetId}/attachments/${attachmentId}/download`, {
    responseType: 'blob'
  });
  return response.data;
}

export default {
  getEmployeeTimesheets,
  getWeeklyTimesheets, // Add this
  createTimesheet,
  getTimesheetById,
  getAllTimesheets,
  updateTimesheetStatus,
  downloadAttachment // Add this
};