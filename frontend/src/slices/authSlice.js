import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../axios";
import { setUser } from "./userSlice"; // Import setUser from userSlice

// Sync user with backend after Azure login
export const syncAzureUser = createAsyncThunk(
  "auth/syncAzureUser",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.get(`/auth/me?t=${new Date().getTime()}`, { ignoreAuthRedirect: true });
      
      // Extract the actual user object from the ApiResponse wrapper
      // /auth/me returns { success: true, data: { user: {...} } }
      const raw = response.data;
      const userData = raw?.user || raw?.data?.user || raw?.data || raw;
      
      dispatch(setUser(userData));
      
      return userData;
    } catch (error) {
      // Suppress noisy console error on startup if there is no session
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
    logout: (state) => {
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
        // Only trigger blocking full-page loading if not yet authenticated.
        // Background syncs (e.g. SSE role/project updates) must be silent!
        if (!state.isAuthenticated) {
          state.loading = true;
        }
      })
      .addCase(syncAzureUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(syncAzureUser.rejected, (state) => {
        state.loading = false;
        // Only drop session if user was not authenticated
        if (!state.isAuthenticated) {
          state.isAuthenticated = false;
          state.user = null;
        }
      });
  },
});

export const { setAzureAccount, logout, setLoading, setAuthUser } = authSlice.actions;
export default authSlice.reducer;
