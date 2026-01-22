import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../axios";
import { setUser } from "./userSlice"; // Import setUser from userSlice

// Sync user with backend after Azure login
export const syncAzureUser = createAsyncThunk(
  "auth/syncAzureUser",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.get("/auth/me");
      
      dispatch(setUser(response.data));
      
      return response.data;
    } catch (error) {
      console.error("Sync error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || "Sync failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    azureAccount: null,
    isAuthenticated: false,
    loading: false,
  },
  reducers: {
    setAzureAccount: (state, action) => {
      state.azureAccount = action.payload;
    },
    logout: (state, action) => {
      state.user = null;
      state.azureAccount = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setAuthUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncAzureUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(syncAzureUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(syncAzureUser.rejected, (state, action) => {
        console.error("Sync rejected:", action.payload);
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { setAzureAccount, logout, setLoading, setAuthUser } = authSlice.actions;
export default authSlice.reducer;