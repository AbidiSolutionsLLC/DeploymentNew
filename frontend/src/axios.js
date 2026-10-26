import axios from "axios";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest, msalInstance } from "./authConfig";
import { toast } from "react-toastify";
import { TIMEZONE } from "./utils/dateUtils";

let store;
export const injectStore = (_store) => {
  store = _store;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1",
  timeout: 15000,
  withCredentials: true,
});

api.interceptors.request.use(
  async (config) => {
    config.headers["X-Timezone"] = TIMEZONE;

    // Test environment header injection
    if (
      import.meta.env.MODE === "test" &&
      import.meta.env.VITE_TEST_AUTH_SECRET &&
      import.meta.env.VITE_TEST_USER_EMAIL &&
      localStorage.getItem("portalTestAuth") === "true"
    ) {
      config.headers["x-test-auth-secret"] = import.meta.env.VITE_TEST_AUTH_SECRET;
      config.headers["x-test-user-email"] = import.meta.env.VITE_TEST_USER_EMAIL;
      return config;
    }

    if (config.headers._skipAuth) {
      delete config.headers._skipAuth;
      return config;
    }

    try {
      const localToken = localStorage.getItem("accessToken");

      // 1. Prioritize local token if present
      if (localToken && localToken !== "undefined" && localToken !== "null") {
        config.headers.Authorization = `Bearer ${localToken}`;
        return config;
      }

      // 2. Otherwise check for active MSAL session
      const accounts = msalInstance.getAllAccounts();
      const activeAccount = msalInstance.getActiveAccount() || (accounts.length > 0 ? accounts[0] : null);

      if (activeAccount) {
        try {
          const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: activeAccount,
          });
          if (response?.idToken) {
            config.headers.Authorization = `Bearer ${response.idToken}`;
          }
        } catch (error) {
          console.warn("[AXIOS] MSAL silent token acquisition warning:", error?.message || error);
        }
      }
    } catch (error) {
      console.error("[AXIOS] Auth header preparation error:", error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

let isRedirecting = false;

const performLogout = async () => {
  if (isRedirecting) return;
  isRedirecting = true;

  console.warn("[AXIOS] Session could not be refreshed. Logging out.");

  try {
    localStorage.removeItem("accessToken");
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("msal.") ||
          key.includes("login.microsoftonline.com") ||
          key === "accessToken")
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
  } catch (e) {
    console.error("[AXIOS] Cleanup failed:", e);
  }

  if (store) {
    store.dispatch({ type: "auth/logout" });
  }

  if (!window.location.pathname.startsWith("/auth/login")) {
    setTimeout(() => {
      window.location.replace("/auth/login");
    }, 150);
  }
};

api.interceptors.response.use(
  (response) => {
    // Automatically unwrap the backend's ApiResponse wrapper on success
    if (response.data && response.data.success === true && "data" in response.data) {
      if (response.data.pagination) {
        response.pagination = response.data.pagination;
      }
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (
      error.code === "ECONNABORTED" ||
      error.message?.includes("timeout") ||
      error.message?.includes("Network Error")
    ) {
      toast.error("Network issue. Request timed out, try again");
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const ignoreAuthRedirect = originalRequest?.ignoreAuthRedirect;

    // Handle 401 Unauthorized
    if (status === 401 && !ignoreAuthRedirect && originalRequest) {
      // If the 401 is already from the refresh-token endpoint, or login endpoint, fail immediately
      if (
        originalRequest.url?.includes("/auth/refresh-token") ||
        originalRequest.url?.includes("/auth/login") ||
        originalRequest._retry
      ) {
        await performLogout();
        return Promise.reject(error);
      }

      // If another refresh is already running, wait in queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt 1: Try refreshing local JWT using httpOnly refreshToken cookie
        let refreshedToken = null;
        try {
          const refreshRes = await axios.get(
            `${api.defaults.baseURL}/auth/refresh-token`,
            {
              withCredentials: true,
              headers: { _skipAuth: "true" },
            }
          );
          const raw = refreshRes.data?.data || refreshRes.data;
          refreshedToken = raw?.accessToken || raw?.token;

          if (refreshedToken) {
            localStorage.setItem("accessToken", refreshedToken);
            if (store && raw?.user) {
              store.dispatch({ type: "auth/setAuthUser", payload: raw.user });
            }
          }
        } catch (localRefreshErr) {
          // If local refresh endpoint failed, attempt MSAL silent refresh if account exists
          const accounts = msalInstance.getAllAccounts();
          const activeAccount = msalInstance.getActiveAccount() || (accounts.length > 0 ? accounts[0] : null);

          if (activeAccount) {
            try {
              const msalRes = await msalInstance.acquireTokenSilent({
                ...loginRequest,
                account: activeAccount,
                forceRefresh: true,
              });
              refreshedToken = msalRes?.idToken;
            } catch (msalRefreshErr) {
              console.warn("[AXIOS] MSAL force silent refresh failed:", msalRefreshErr?.message || msalRefreshErr);
            }
          }
        }

        if (refreshedToken) {
          processQueue(null, refreshedToken);
          originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
          return api(originalRequest);
        } else {
          // Could not refresh with either method
          processQueue(new Error("Unable to refresh session"), null);
          await performLogout();
          return Promise.reject(error);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await performLogout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
