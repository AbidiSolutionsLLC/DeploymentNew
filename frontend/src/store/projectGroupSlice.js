import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../axios';

export const fetchProjectGroups = createAsyncThunk(
  'projectGroups/fetchProjectGroups',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/project-groups');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch project groups');
    }
  }
);

export const createProjectGroup = createAsyncThunk(
  'projectGroups/createProjectGroup',
  async (groupData, { rejectWithValue }) => {
    try {
      const response = await api.post('/project-groups', groupData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create project group');
    }
  }
);

export const deleteProjectGroup = createAsyncThunk(
  'projectGroups/deleteProjectGroup',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/project-groups/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete project group');
    }
  }
);

const projectGroupSlice = createSlice({
  name: 'projectGroups',
  initialState: {
    groups: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectGroups.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProjectGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload;
        state.error = null;
      })
      .addCase(fetchProjectGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createProjectGroup.fulfilled, (state, action) => {
        state.groups.unshift(action.payload);
      })
      .addCase(deleteProjectGroup.fulfilled, (state, action) => {
        state.groups = state.groups.filter(g => g._id !== action.payload);
      });
  },
});

export default projectGroupSlice.reducer;


