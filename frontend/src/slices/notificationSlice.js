import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../axios';

// --- Async Thunks ---

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async ({ page = 1, limit = 20, isRead } = {}) => {
    const params = { page, limit };
    if (isRead !== undefined) params.isRead = isRead;
    const { data } = await api.get('/notifications', { params });
    return data;
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/unreadCount',
  async () => {
    const { data } = await api.get('/notifications/unread-count');
    return data.count;
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id) => {
    await api.patch(`/notifications/${id}/read`);
    return id;
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async () => {
    await api.patch('/notifications/mark-all-read');
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (id) => {
    await api.delete(`/notifications/${id}`);
    return id;
  }
);

// --- Slice ---

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    pagination: {},
    loading: false,
    error: null,
  },
  reducers: {
    // Prepend a real-time SSE notification to the top of the list
    addRealtimeNotification(state, action) {
      // Avoid duplicates (e.g. if the CONNECTED event sneaks through)
      if (!action.payload._id) return;
      const exists = state.items.some(n => n._id === action.payload._id);
      if (!exists) {
        state.items.unshift(action.payload);
      }
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notif = state.items.find((n) => n._id === action.payload);
        if (notif && !notif.isRead) {
          notif.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.items.forEach((n) => { n.isRead = true; });
        state.unreadCount = 0;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const wasUnread = state.items.find(n => n._id === action.payload && !n.isRead);
        state.items = state.items.filter((n) => n._id !== action.payload);
        if (wasUnread) state.unreadCount = Math.max(0, state.unreadCount - 1);
      });
  },
});

export const { addRealtimeNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
