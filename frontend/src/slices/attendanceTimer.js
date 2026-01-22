import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../axios";

export const checkInNow = createAsyncThunk(
  'employee/checkin',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/timetrackers/check-in', {}, {
        withCredentials: true
      });

      // After check-in, fetch the current status to ensure sync
      // This handles the case where backend auto-closed a previous session
      dispatch(fetchCurrentStatus());

      return response.data;
    } catch (err) {
      const errorData = err.response?.data;
      console.log("Check-in error:", errorData);

      return rejectWithValue({
        message: errorData?.message || "Check-in failed",
        status: err.response?.status,
        autoClosed: errorData?.autoClosed
      });
    }
  }
);

export const checkOutNow = createAsyncThunk(
  'employee/checkout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/timetrackers/check-out', {}, {
        withCredentials: true
      });

      console.log("Check-out response:", response.data);
      return response.data;
    } catch (err) {
      const errorData = err.response?.data;
      console.log("Check-out error:", errorData);

      return rejectWithValue({
        message: errorData?.message || "Check-out failed",
        status: err.response?.status
      });
    }
  }
);

// Fetch current session status from backend
export const fetchCurrentStatus = createAsyncThunk(
  'employee/fetchCurrentStatus',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const userId = state.auth.user.user._id;
      if (!userId) {
        return rejectWithValue({ message: "User not authenticated" });
      }

      const response = await api.get(`/timetrackers/daily-log/${userId}`);
      return response.data;
    } catch (err) {
      const errorData = err.response?.data;
      return rejectWithValue({
        message: errorData?.message || "Failed to fetch current status",
        status: err.response?.status
      });
    }
  }
);

// Add a thunk to get today's status (keeping for backward compatibility)
export const getTodayStatus = createAsyncThunk(
  'employee/getTodayStatus',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const userId = state.auth?.user?.id || state.auth?.user?._id;

      if (!userId) {
        return rejectWithValue({ message: "User not authenticated" });
      }

      const response = await api.get(`/timetrackers/daily-log/${userId}`);
      return response.data;
    } catch (err) {
      const errorData = err.response?.data;
      return rejectWithValue({
        message: errorData?.message || "Failed to get today's status",
        status: err.response?.status
      });
    }
  }
);

const attendanceTimerSlice = createSlice({
  name: 'employee',
  initialState: {
    checkInn: null,
    checkOut: null,
    todayLog: null,
    loading: false,
    error: null,
  },
  reducers: {
    setError(state, action) {
      state.error = action.payload;
    },
    resetCheckIn(state) {
      state.checkInn = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkInNow.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkInNow.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.checkInn = action.payload;
        state.checkOut = null;
        
        if (action.payload.autoClosed) {
          console.log("Previous session was auto-closed");
        }
      })
      .addCase(checkInNow.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(checkOutNow.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkOutNow.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.checkOut = action.payload;
        state.checkInn = null;
      })
      .addCase(checkOutNow.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(fetchCurrentStatus.fulfilled, (state, action) => {
        const log = action.payload.log;
        
        // If there's an active session (has checkInTime but no checkOutTime)
        if (log && log.checkInTime && !log.checkOutTime) {
          state.checkInn = { log };
          state.checkOut = null;
        } else {
          // No active session or session is closed
          state.checkInn = null;
          state.checkOut = log ? { log } : null;
        }
        
        state.todayLog = log;
      })
      .addCase(fetchCurrentStatus.rejected, (state, action) => {
        // If no log found, reset the state
        state.checkInn = null;
        state.checkOut = null;
        state.todayLog = null;
      })
      .addCase(getTodayStatus.fulfilled, (state, action) => {
        state.todayLog = action.payload.log;
      })
  }
});

export const { setError, resetCheckIn } = attendanceTimerSlice.actions;
export default attendanceTimerSlice.reducer;