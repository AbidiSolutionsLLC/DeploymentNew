// import api from '../axios';

// const API_URL = '/projects';

// const getProjects = async () => {
//   const response = await api.get(API_URL);
//   return response;
// };

// const getProjectById = async (id) => {
//   const response = await api.get(`${API_URL}/${id}`);
//   return response;
// };

// const getProjectTasks = async (projectId) => {
//   const response = await api.get(`${API_URL}/${projectId}/tasks`);
//   return response;
// };

// const createProject = async (projectData) => {
//   const response = await api.post(API_URL, projectData);
//   return response;
// };

// const updateProject = async (id, updates) => {
//   const response = await api.patch(`${API_URL}/${id}`, updates);
//   return response;
// };

// const deleteProject = async (id) => {
//   const response = await api.delete(`${API_URL}/${id}`);
//   return response;
// };

// const getProjectDashboard = async () => {
//   const response = await api.get(`${API_URL}/dashboard`);
//   return response;
// };

// export default {
//   getProjects,
//   getProjectById,
//   getProjectTasks,
//   createProject,
//   updateProject,
//   deleteProject,
//   getProjectDashboard,
// };

// src/api/projectApi.js
// This mocks an axios-like interface so existing code expecting `response.data` still works.
const mockDelay = (ms) => new Promise((res) => setTimeout(res, ms));

const API_URL = "/projectsData.json"; // <-- change to real API later

const getProjects = async () => {
  await mockDelay(500); // simulate network latency
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Failed to fetch projects");
  const data = await response.json();
  return { data };
};

const getProjectById = async (id) => {
  await mockDelay(300);
  const resp = await fetch(API_URL);
  if (!resp.ok) throw new Error("Failed to fetch project");
  const all = await resp.json();
  return { data: all.find((p) => p.id === id) || null };
};

const createProject = async (projectData) => {
  await mockDelay(300);
  // NOTE: since this is local static data, we just return created object
  return { data: { ...projectData, id: `p${Date.now()}` } };
};

const updateProject = async (id, updates) => {
  await mockDelay(300);
  return { data: { id, ...updates } };
};

const deleteProject = async (id) => {
  await mockDelay(300);
  return { data: id };
};

export default {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
