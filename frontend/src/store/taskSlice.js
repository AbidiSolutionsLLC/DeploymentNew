import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/taskApi';

export const fetchMyTasks = createAsyncThunk(
  'tasks/fetchMyTasks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getMyTasks();
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchProjectTasks = createAsyncThunk(
  'tasks/fetchProjectTasks',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await api.getProjectTasks(projectId);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await api.createTask(taskData);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await api.updateTask(id, updates);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchProjectActivities = createAsyncThunk(
  'tasks/fetchProjectActivities',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await api.getProjectActivities(projectId);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateTaskStatus = createAsyncThunk(
  'tasks/updateTaskStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await api.updateTaskStatus(id, status);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchTaskComments = createAsyncThunk(
  'tasks/fetchTaskComments',
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await api.getTaskComments(taskId);
      return { taskId, comments: response };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const addTaskComment = createAsyncThunk(
  'tasks/addTaskComment',
  async ({ taskId, content }, { rejectWithValue }) => {
    try {
      const response = await api.addTaskComment(taskId, content);
      return { taskId, comment: response };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
    projectTasks: [],
    taskComments: {},
    projectActivities: [],
    projectActivitiesLoading: false,
    loading: false,
    projectTasksLoading: false,
    error: null,
  },
  reducers: {
    clearProjectTasks: (state) => {
      state.projectTasks = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchMyTasks
      .addCase(fetchMyTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyTasks.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        state.tasks = Array.isArray(payload) ? payload : payload?.data || [];
      })
      .addCase(fetchMyTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchProjectTasks
      .addCase(fetchProjectTasks.pending, (state) => {
        state.projectTasksLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectTasks.fulfilled, (state, action) => {
        state.projectTasksLoading = false;
        state.projectTasks = action.payload;
      })
      .addCase(fetchProjectTasks.rejected, (state, action) => {
        state.projectTasksLoading = false;
        state.error = action.payload;
      })
      // createTask
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
        state.projectTasks.push(action.payload);
      })
      // updateTask
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        const projIndex = state.projectTasks.findIndex(t => t._id === action.payload._id);
        if (projIndex !== -1) {
          state.projectTasks[projIndex] = action.payload;
        }
      })
      .addCase(fetchProjectActivities.pending, (state) => {
        state.projectActivitiesLoading = true;
      })
      .addCase(fetchProjectActivities.fulfilled, (state, action) => {
        state.projectActivitiesLoading = false;
        state.projectActivities = action.payload;
      })
      .addCase(fetchProjectActivities.rejected, (state, action) => {
        state.projectActivitiesLoading = false;
        state.error = action.payload;
      })
      // updateTaskStatus
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        const projIndex = state.projectTasks.findIndex(t => t._id === action.payload._id);
        if (projIndex !== -1) {
          state.projectTasks[projIndex] = action.payload;
        }
      })
      // fetchTaskComments
      .addCase(fetchTaskComments.fulfilled, (state, action) => {
        state.taskComments[action.payload.taskId] = action.payload.comments;
      })
      // addTaskComment
      .addCase(addTaskComment.fulfilled, (state, action) => {
        const { taskId, comment } = action.payload;
        if (!state.taskComments[taskId]) {
          state.taskComments[taskId] = [];
        }
        state.taskComments[taskId].unshift(comment);
      });
  },
});

export const { clearProjectTasks } = taskSlice.actions;

export default taskSlice.reducer;