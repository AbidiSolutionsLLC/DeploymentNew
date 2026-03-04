import axios from "axios";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "./authConfig";
import { toast } from "react-toastify"; // Import toast
 
let store;
 function clearAllCookies() {
  const cookies = document.cookie.split(";");
  
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    // Set expiration date to past to delete the cookie
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    
    // Also clear with domain if needed
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
    
    // Clear for all subdomains
    const domainParts = window.location.hostname.split('.');
    while (domainParts.length > 1) {
      const domain = domainParts.join('.');
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + domain;
      domainParts.shift();
    }
  }
}
export const injectStore = (_store) => {
  store = _store;
};
 
const msalInstance = new PublicClientApplication(msalConfig);
let msalInitialized = false;
 
const api = axios.create({
  baseURL: "/api/web",
  timeout: 30000,
  withCredentials: true 
});
 
api.interceptors.request.use(
  async (config) => {
    try {
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
        } catch (error) {
          console.error("Silent token acquisition failed:", error);
        }
      }
    } catch (error) {
      console.error("MSAL initialization error:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);
 
// --- UPDATED RESPONSE INTERCEPTOR FOR TOASTS ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || "An unexpected error occurred";

    // =========================
    // 401 → FORCE LOGOUT
    // =========================
    if (status === 401) {
      console.warn("[AXIOS] 401 Unauthorized — logging out");

      try {
        localStorage.clear();
        sessionStorage.clear();
        clearAllCookies();

        // Clear IndexedDB (safe)
        if (window.indexedDB?.databases) {
          const databases = await window.indexedDB.databases();
          databases.forEach((db) => {
            if (db.name) window.indexedDB.deleteDatabase(db.name);
          });
        }
      } catch (e) {
        console.error("Cleanup failed:", e);
      }

      // Prevent redirect loop
      if (!window.location.pathname.startsWith("/auth/login")) {
        window.location.replace("/auth/login");
      }

      return Promise.reject(error);
    }

    // =========================
    // 403 / 400 → TOAST
    // =========================
    if (status === 403 || status === 400) {
      toast.error(message);
    }

    // =========================
    // 500 → SERVER ERROR
    // =========================
    if (status === 500) {
      toast.error("Internal Server Error: Please check backend logs.");
    }

    return Promise.reject(error);
  }
);

 
export default api;
