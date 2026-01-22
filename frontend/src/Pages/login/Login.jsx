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

  console.log("=== Login Component State ===");
  console.log("accounts:", accounts);
  console.log("accounts.length:", accounts.length);
  console.log("inProgress:", inProgress);
  console.log("isAuthenticated:", isAuthenticated);
  console.log("user:", user);
  console.log("loading:", loading);
  console.log("============================");

  const handleLogin = () => {
    console.log("Starting login redirect...");
    instance.loginRedirect(loginRequest).catch((e) => {
      console.error("Login redirect error:", e);
      toast.error("Login failed. Please try again.");
    });
  };

  useEffect(() => {
    console.log("Login useEffect triggered - accounts.length:", accounts.length);
    
    if (accounts.length > 0) {
      console.log("Found account:", accounts[0]);
      
      if (!isAuthenticated && !loading) {
        console.log("Starting sync process...");
        dispatch(setAzureAccount(accounts[0]));
        
        dispatch(syncAzureUser())
          .unwrap()
          .then((userData) => {
            console.log("Sync successful:", userData);
          })
          .catch((error) => {
            console.error("Sync failed:", error);
            toast.error("Failed to sync user data. Please try logging in again.");
          });
      } else {
        console.log("Skipping sync - already authenticated or loading");
      }
    } else {
      console.log("No accounts found yet");
    }
  }, [accounts, dispatch, isAuthenticated, loading]);

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("Authenticated! Redirecting to home...");
      navigate("/people/home", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-[#274744] px-4 w-full bg-no-repeat bg-cover bg-center"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 560'%3E%3Cg fill='none'%3E%3Crect width='1440' height='560' fill='%23154360'/%3E%3Cpath d='M0,436.541C103.565,447.583,212.964,523.643,303.953,472.961C394.296,422.639,377.53,285.398,430.645,196.669C493.253,92.082,654.196,28.96,642.365,-92.358C630.688,-212.093,472.275,-252.285,379.405,-328.757C303.515,-391.247,238.141,-463.709,146.91,-500.331C48.933,-539.66,-55.561,-559.918,-160.124,-545.331C-275.788,-529.196,-393.142,-494.606,-476.973,-413.299C-564.136,-328.76,-619.294,-211.482,-629.122,-90.454C-638.677,27.212,-599.445,146.523,-530.195,242.132C-467.305,328.961,-365.631,375.395,-264.972,412.304C-179.98,443.469,-90.016,426.944,0,436.541' fill='%230f2e42'/%3E%3Cpath d='M1440 1073.273C1545.372 1078.74 1650.319 1078.863 1748.314 1039.746C1861.051 994.744 1984.829 942.151 2039.715 833.881C2095.009 724.805 2056.621 594.812 2034.872 474.47C2013.832 358.048 2009.268 220.212 1915.72 147.786C1822.471 75.592 1686.966 134.476 1570.645 115.063C1472.835 98.74 1383.443 15.411 1288.213 43.062C1192.96 70.72 1164.449 191.732 1088.187 255.152C990.756 336.176 832.25 349.476 780.605 465.193C728.256 582.488 754.837 733.742 827.242 839.837C897.378 942.607 1035.312 964.491 1151.583 1008.785C1245.545 1044.58 1339.586 1068.063 1440 1073.273' fill='%231c587e'/%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      <div className="bg-white bg-opacity-10 p-8 rounded-xl shadow-md text-center max-w-md w-full">
        <div className="flex justify-center mb-6">
          <img src="https://cdn-icons-png.flaticon.com/512/732/732221.png" alt="Microsoft" className="w-16 h-16"/>
        </div>
        
        <h2 className="text-white text-3xl font-bold mb-2">Welcome Back</h2>
        <p className="text-gray-200 mb-8">Sign in with your corporate account</p>

        {loading || inProgress !== "none" ? (
          <div className="text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-2"></div>
            <p>Loading your profile...</p>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 border border-gray-400 rounded shadow flex items-center justify-center gap-2 transition-all"
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