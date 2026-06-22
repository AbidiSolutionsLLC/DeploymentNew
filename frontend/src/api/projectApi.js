import api from '../axios';

const API_URL = '/projects';

const getProjects = async () => {
 const response = await api.get(API_URL);
 return response.data?.data || response.data;
};

const getProjectById = async (id) => {
 const response = await api.get(`${API_URL}/${id}`);
 return response.data?.data || response.data;
};

const getProjectTasks = async (projectId) => {
 const response = await api.get(`${API_URL}/${projectId}/tasks`);
 return response.data?.data || response.data;
};

const createProject = async (projectData) => {
 const response = await api.post(API_URL, projectData);
 return response.data?.data || response.data;
};

const updateProject = async (id, updates) => {
 const response = await api.patch(`${API_URL}/${id}`, updates);
 return response.data?.data || response.data;
};

const deleteProject = async (id) => {
 const response = await api.delete(`${API_URL}/${id}`);
 return response.data?.data || response.data;
};

const getProjectDashboard = async () => {
 const response = await api.get(`${API_URL}/dashboard`);
 return response.data?.data || response.data;
};

const projectApi = {
 getProjects,
 getProjectById,
 getProjectTasks,
 createProject,
 updateProject,
 deleteProject,
 getProjectDashboard,
};

export default projectApi;
