// taskApi.js
import api from '../axios';

const API_URL = '/tasks';

const getMyTasks = async () => {
 const response = await api.get(`${API_URL}/me`);
 return response.data?.data || response.data;
};

const createTask = async (taskData) => {
 const response = await api.post(API_URL, taskData);
 return response.data?.data || response.data;
};

const updateTask = async (id, updates) => {
 const response = await api.patch(`${API_URL}/${id}`, updates);
 return response.data?.data || response.data;
};

const taskApi = {
 getMyTasks,
 createTask,
 updateTask,
};

export default taskApi;