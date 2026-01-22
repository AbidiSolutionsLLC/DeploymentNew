import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../axios";

// Async thunk to refresh user data
export const refreshUserData = createAsyncThunk(
  "user/refreshUserData",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to refresh user data');
    }
  }
);

// Async thunk to apply for leave
export const applyForLeave = createAsyncThunk(
  "user/applyForLeave",
  async (leaveData, { rejectWithValue }) => {
    try {
      const response = await api.post('/leaves', leaveData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply for leave');
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    userInfo: null,
    loading: false,
    error: null,
    refreshing: false,
  },
  reducers: {
    setUser: (state, action) => {
      state.userInfo = action.payload;
      state.error = null;
    },
    clearUser: (state) => {
      state.userInfo = null;
      state.error = null;
      state.loading = false;
      state.refreshing = false;
    },
    updateLeaveBalances: (state, action) => {
      if (state.userInfo) {
        if (!state.userInfo.leaves) {
          state.userInfo.leaves = {};
        }
        state.userInfo.leaves = {
          ...state.userInfo.leaves,
          ...action.payload
        };
      }
    },
    addLeaveToHistory: (state, action) => {
      if (state.userInfo) {
        if (!state.userInfo.leaveHistory) {
          state.userInfo.leaveHistory = [];
        }
        state.userInfo.leaveHistory.unshift(action.payload);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Refresh User Data
      .addCase(refreshUserData.pending, (state) => {
        state.refreshing = true;
        state.error = null;
      })
      .addCase(refreshUserData.fulfilled, (state, action) => {
        state.refreshing = false;
        state.userInfo = action.payload;
      })
      .addCase(refreshUserData.rejected, (state, action) => {
        state.refreshing = false;
        state.error = action.payload;
      })
      // Apply for Leave
      .addCase(applyForLeave.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyForLeave.fulfilled, (state, action) => {
        state.loading = false;
        
        // Add leave to history
        if (state.userInfo) {
          if (!state.userInfo.leaveHistory) {
            state.userInfo.leaveHistory = [];
          }
          state.userInfo.leaveHistory.unshift(action.payload);
          
          const leaveType = action.payload.leaveType;
          const days = action.payload.days || 1;
          
          if (state.userInfo.leaves) {
            if (leaveType === 'PTO' && state.userInfo.leaves.pto !== undefined) {
              state.userInfo.leaves.pto = Math.max(0, state.userInfo.leaves.pto - days);
            } else if (leaveType === 'Sick' && state.userInfo.leaves.sick !== undefined) {
              state.userInfo.leaves.sick = Math.max(0, state.userInfo.leaves.sick - days);
            }
          }
        }
      })
      .addCase(applyForLeave.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  setUser, 
  clearUser, 
  updateLeaveBalances, 
  addLeaveToHistory,
  clearError 
} = userSlice.actions;

export default userSlice.reducer;