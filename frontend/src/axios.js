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
  (error) => {
    // Extract the exact message we set in globalErrorHandler.js
    const message = error.response?.data?.message || "An unexpected error occurred";
 
     if (status === 401) { 
      console.log('[AXIOS] 401 Unauthorized - Clearing session///////////////////////////////////////');
       localStorage.clear();
      sessionStorage.clear();
       clearIndexedDB().catch(console.error);
        clearAllCookies();
          window.location.href = '/auth/login';


      // Prevent infinite redirect loop
      if (!window.location.pathname.includes('/auth/login')) {
        window.location.href = "/auth/login";
      }
    }
 
    // Automatically trigger a toast for 403 (Forbidden) and 400 (Bad Request)
    if (error.response?.status === 403 || error.response?.status === 400) {
      toast.error(message); // This will show your "Permission Denied" message!
    }
 
    // Also trigger for 500 so you know when the server crashes
    if (error.response?.status === 500) {
      toast.error("Internal Server Error: Please check backend logs.");
    }
 
    return Promise.reject(error);
  }
);
 
export default api;
