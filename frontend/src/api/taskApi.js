// taskApi.js
import api from '../axios';

const API_URL = '/tasks';

const getMyTasks = async () => {
 const response = await api.get(`${API_URL}/user`);
 return response.data?.data || response.data;
};

const getProjectTasks = async (projectId) => {
 const response = await api.get(`${API_URL}/project/${projectId}`);
 return response.data?.data || response.data;
};

const createTask = async (taskData) => {
 const response = await api.post(API_URL, taskData);
 return response.data?.data || response.data;
};

const updateTask = async (id, updates) => {
 const response = await api.put(`${API_URL}/${id}`, updates);
 return response.data?.data || response.data;
};

const updateTaskStatus = async (id, status) => {
 const response = await api.patch(`${API_URL}/${id}/status`, { status });
 return response.data?.data || response.data;
};

const getTaskComments = async (taskId) => {
 const response = await api.get(`${API_URL}/${taskId}/comments`);
 return response.data?.data || response.data;
};

const addTaskComment = async (taskId, content) => {
 const response = await api.post(`${API_URL}/${taskId}/comments`, { content });
 return response.data?.data || response.data;
};

const getProjectActivities = async (projectId) => {
 const response = await api.get(`/activities/project/${projectId}`);
 return response.data?.data || response.data;
};

const taskApi = {
 getMyTasks,
 getProjectTasks,
 createTask,
 updateTask,
 updateTaskStatus,
 getTaskComments,
 addTaskComment,
 getProjectActivities,
};

export default taskApi;