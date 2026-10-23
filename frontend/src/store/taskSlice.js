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
  async ({ taskId, content, files, replyTo }, { rejectWithValue }) => {
    try {
      const response = await api.addTaskComment(taskId, { content, files, replyTo });
      return { taskId, comment: response };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteTaskComment = createAsyncThunk(
  'tasks/deleteTaskComment',
  async ({ taskId, commentId }, { rejectWithValue }) => {
    try {
      await api.deleteTaskComment(taskId, commentId);
      return { taskId, commentId };
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
    addRealtimeTaskComment: (state, action) => {
      const { taskId, comment } = action.payload || {};
      if (!taskId || !comment) return;
      if (!state.taskComments[taskId]) {
        state.taskComments[taskId] = [];
      }
      const commentId = (comment._id || comment.id)?.toString();
      const exists = state.taskComments[taskId].some(
        (c) => (c._id || c.id)?.toString() === commentId
      );
      if (!exists) {
        state.taskComments[taskId].push(comment);
      }
    },
    removeRealtimeTaskComment: (state, action) => {
      const { taskId, commentId } = action.payload || {};
      if (!taskId || !commentId || !state.taskComments[taskId]) return;
      const idStr = commentId.toString();
      state.taskComments[taskId] = state.taskComments[taskId].filter(
        (c) => (c._id || c.id)?.toString() !== idStr
      );
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
        state.tasks = action.payload;
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
        state.tasks.unshift(action.payload);
        state.projectTasks.unshift(action.payload);
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
      // fetchProjectActivities
      .addCase(fetchProjectActivities.pending, (state) => {
        state.projectActivitiesLoading = true;
      })
      .addCase(fetchProjectActivities.fulfilled, (state, action) => {
        state.projectActivitiesLoading = false;
        state.projectActivities = action.payload;
      })
      .addCase(fetchProjectActivities.rejected, (state) => {
        state.projectActivitiesLoading = false;
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
        state.taskComments[taskId].push(comment);
      })
      // deleteTaskComment
      .addCase(deleteTaskComment.fulfilled, (state, action) => {
        const { taskId, commentId } = action.payload;
        if (state.taskComments[taskId]) {
          state.taskComments[taskId] = state.taskComments[taskId].filter(
            (c) => (c._id || c.id) !== commentId
          );
        }
      });
  },
});

export const { clearProjectTasks, addRealtimeTaskComment, removeRealtimeTaskComment } = taskSlice.actions;

export default taskSlice.reducer;
