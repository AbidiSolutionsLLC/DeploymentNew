// taskApi.js
import api from '../axios';

const API_URL = '/tasks';

const getMyTasks = async () => {
  const response = await api.get(`${API_URL}/me`);
  return response;
};

const createTask = async (taskData) => {
  const response = await api.post(API_URL, taskData);
  return response;
};

const updateTask = async (id, updates) => {
  const response = await api.patch(`${API_URL}/${id}`, updates);
  return response;
};

export default {
  getMyTasks,
  createTask,
  updateTask,
};