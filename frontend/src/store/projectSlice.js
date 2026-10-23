import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/projectApi';

const errorMessage = (err, fallback) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  (typeof err?.response?.data === 'string' ? err.response.data : null) ||
  err?.message ||
  fallback;

export const fetchProjects = createAsyncThunk(
 'projects/fetchProjects',
 async (_, { rejectWithValue }) => {
 try {
 const response = await api.getProjects();
 return response;
 } catch (err) {
 return rejectWithValue(errorMessage(err, 'Project request failed'));
 }
 }
);

export const fetchProjectById = createAsyncThunk(
 'projects/fetchProjectById',
 async (id, { rejectWithValue }) => {
 try {
 const response = await api.getProjectById(id);
 return response;
 } catch (err) {
 return rejectWithValue(errorMessage(err, 'Project request failed'));
 }
 }
);

export const fetchProjectTasks = createAsyncThunk(
 'projects/fetchProjectTasks',
 async (projectId, { rejectWithValue }) => {
 try {
 const response = await api.getProjectTasks(projectId);
 return response;
 } catch (err) {
 return rejectWithValue(errorMessage(err, 'Project request failed'));
 }
 }
);

export const createProject = createAsyncThunk(
 'projects/createProject',
 async (projectData, { rejectWithValue }) => {
 try {
 const response = await api.createProject(projectData);
 return response;
 } catch (err) {
 return rejectWithValue(errorMessage(err, 'Project request failed'));
 }
 }
);

export const updateProject = createAsyncThunk(
 'projects/updateProject',
 async ({ id, updates }, { rejectWithValue }) => {
 try {
 const response = await api.updateProject(id, updates);
 return response;
 } catch (err) {
 return rejectWithValue(errorMessage(err, 'Project request failed'));
 }
 }
);

export const deleteProject = createAsyncThunk(
 'projects/deleteProject',
 async (id, { rejectWithValue }) => {
 try {
 await api.deleteProject(id);
 return id;
 } catch (err) {
 return rejectWithValue(errorMessage(err, 'Project request failed'));
 }
 }
);

export const fetchProjectDashboard = createAsyncThunk(
 'projects/fetchDashboard',
 async (_, { rejectWithValue }) => {
 try {
 const response = await api.getProjectDashboard();
 return response;
 } catch (err) {
 return rejectWithValue(errorMessage(err, 'Project request failed'));
 }
 }
);

const projectSlice = createSlice({
 name: 'projects',
 initialState: {
 projects: [],
 currentProject: null,
 tasks: [],
 dashboardData: null,
 loading: false,
 error: null,
 },
 reducers: {},
 extraReducers: (builder) => {
 builder
 .addCase(fetchProjects.pending, (state) => {
 state.loading = true;
 state.error = null;
 })
 .addCase(fetchProjects.fulfilled, (state, action) => {
 state.loading = false;
 state.projects = action.payload;
 })
 .addCase(fetchProjects.rejected, (state, action) => {
 state.loading = false;
 state.error = action.payload;
 })
 .addCase(fetchProjectById.fulfilled, (state, action) => {
 state.currentProject = action.payload;
 })
 .addCase(fetchProjectTasks.fulfilled, (state, action) => {
 state.tasks = action.payload;
 })
 .addCase(createProject.fulfilled, (state, action) => {
 state.projects.push(action.payload);
 })
 .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.currentProject && (state.currentProject._id === action.payload._id || state.currentProject.id === action.payload.id)) {
          state.currentProject = { ...state.currentProject, ...action.payload };
        }
      })
 .addCase(deleteProject.fulfilled, (state, action) => {
 state.projects = state.projects.filter(p => p._id !== action.payload);
 })
 .addCase(fetchProjectDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardData = action.payload;
      })
      .addCase(fetchProjectDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
 },
});

export default projectSlice.reducer;