import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../axios";

export const fetchAttendanceData = createAsyncThunk(
  'attendance/fetchData',
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/timetrackers/attendance/${month}/${year}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch attendance data");
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    data: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendanceData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAttendanceData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default attendanceSlice.reducer;