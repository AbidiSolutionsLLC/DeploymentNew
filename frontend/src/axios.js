import axios from "axios";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "./authConfig";

let store;

export const injectStore = (_store) => {
  store = _store;
};

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);
let msalInitialized = false; // Track initialization

const api = axios.create({
  // Use Environment Variable for URL. Fallback to localhost if not set.
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/web",
  timeout: 30000,
  withCredentials: true // Important for cookies/sessions
});

api.interceptors.request.use(
  async (config) => {
    try {
      // Initialize MSAL only once to prevent errors
      if (!msalInitialized) {
        await msalInstance.initialize();
        msalInitialized = true;
      }
      
      const accounts = msalInstance.getAllAccounts();
      const activeAccount = msalInstance.getActiveAccount() || accounts[0];

      if (activeAccount) {
        try {
          const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: activeAccount
          });
          
          config.headers.Authorization = `Bearer ${response.accessToken}`;
          // console.log("Token attached to request"); // Comment out logs for production
        } catch (error) {
          console.error("Silent token acquisition failed:", error);
          // Optional: You could trigger a logout or redirect here
        }
      }
    } catch (error) {
      console.error("MSAL initialization error:", error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("401 Unauthorized - Session expired or invalid token");
      // Optional: Redirect to login if 401 occurs
      // window.location.href = '/auth/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;