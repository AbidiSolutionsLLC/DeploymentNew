import React, { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../authConfig";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { syncAzureUser, setAzureAccount } from "../../slices/authSlice";
import { toast } from "react-toastify";

const Login = () => {
 const { instance, accounts, inProgress } = useMsal();
 const navigate = useNavigate();
 const dispatch = useDispatch();
 const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

 const handleLogin = () => {
 instance.loginRedirect(loginRequest).catch((e) => {
 console.error("Login redirect error:", e);
 toast.error("Login failed. Please try again.");
 });
 };

 useEffect(() => {
 if (accounts.length > 0) {
 if (!isAuthenticated && !loading) {
 dispatch(setAzureAccount(accounts[0]));
 
 dispatch(syncAzureUser())
 .unwrap()
 .then((userData) => {
 console.log("Sync successful:", userData);
 })
 .catch((error) => {
 console.error("Sync failed:", error);
 
 // --- FIX: Show the REAL error from Backend (Access Denied) ---
 const errorMessage = error?.message || error || "Login failed";
 
 if (errorMessage.includes("Access Denied") || errorMessage.includes("uninvited")) {
 toast.error("ACCESS DENIED: You must be invited to the portal by an Admin.");
 } else {
 toast.error(errorMessage);
 }
 });
 }
 }
 }, [accounts, dispatch, isAuthenticated, loading]);

 useEffect(() => {
 if (isAuthenticated && user) {
 navigate("/people/home", { replace: true });
 }
 }, [isAuthenticated, user, navigate]);

 return (
 <div className="flex items-center justify-center min-h-screen bg-app px-4 w-full">
 <div className="glass-card p-8 shadow-md text-center max-w-md w-full">
 <div className="flex justify-center mb-6">
 <img src="https://cdn-icons-png.flaticon.com/512/732/732221.png" alt="Microsoft" className="w-16 h-16"/>
 </div>

 <h2 className="text-heading text-3xl font-bold mb-2">Welcome Back</h2>
 <p className="text-muted mb-8">Sign in with your corporate account</p>

 {loading || inProgress !== "none" ? (
 <div className="text-main">
 <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand mx-auto mb-2"></div>
 <p>Loading your profile...</p>
 </div>
 ) : (
 <button
 onClick={handleLogin}
 className="btn btn-primary w-full flex items-center justify-center gap-2"
 >
 <img src="https://learn.microsoft.com/en-us/azure/active-directory/develop/media/howto-add-branding-in-azure-ad-apps/ms-symbollockup_mssymbol_19.png" alt="" className="h-5"/>
 Sign in with Microsoft
 </button>
 )}
 </div>
 </div>
 );
};

export default Login;