import api from '../axios';

const API_URL = '/projects';

const getProjects = async () => {
 // Portal loads the full list once and does search/filter/sort/pagination client-side
 const response = await api.get(`${API_URL}?limit=1000`);
 const raw = response.data?.data || response.data;
 return Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data) ? raw.data : (Array.isArray(raw?.projects) ? raw.projects : []));
};

const getProjectById = async (id) => {
 const response = await api.get(`${API_URL}/${id}`);
 return response.data?.data || response.data;
};

const getProjectTasks = async (projectId) => {
 const response = await api.get(`/tasks/project/${projectId}`);
 return response.data?.data || response.data;
};

const createProject = async (projectData) => {
 const response = await api.post(API_URL, projectData);
 return response.data?.data || response.data;
};

const updateProject = async (id, updates) => {
 const response = await api.put(`${API_URL}/${id}`, updates);
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

const getProjectDashboardCards = async () => {
 const response = await api.get(`${API_URL}/dashboard-cards`);
 return response.data?.data || response.data;
};

const addProjectDashboardCard = async (type) => {
 const response = await api.post(`${API_URL}/dashboard-cards/add`, { type });
 return response.data?.data || response.data;
};

const removeProjectDashboardCard = async (cardId) => {
 const response = await api.delete(`${API_URL}/dashboard-cards/${cardId}`);
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
 getProjectDashboardCards,
 addProjectDashboardCard,
 removeProjectDashboardCard,
};

export default projectApi;
