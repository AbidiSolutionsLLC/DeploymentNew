import React, { useEffect, useRef, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../authConfig";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { syncAzureUser, setAzureAccount } from "../../slices/authSlice";
import { toast } from "react-toastify";
import Loader from "../../components/ui/Loader";
import api from "../../axios";
import { Mail, Lock, LogIn } from "lucide-react";

const Login = () => {
  const { instance, accounts, inProgress } = useMsal();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  const handleMicrosoftLogin = () => {
    instance.loginRedirect(loginRequest).catch((e) => {
      console.error("Login redirect error:", e);
      toast.error("Login failed. Please try again.");
    });
  };

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLocalLoading(true);
    try {
      await api.post("/auth/login", { email, password });
      toast.success("OTP sent to your email!");
      navigate("/auth/verify-otp", { state: { email } });
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLocalLoading(false);
    }
  };

  const attemptedAccountRef = useRef(null);

  useEffect(() => {
    if (accounts.length > 0) {
      const currentAccount = accounts[0];
      // Only sync if we haven't already tried for this account in this session
      if (!isAuthenticated && !loading && attemptedAccountRef.current !== currentAccount.homeAccountId) {
        attemptedAccountRef.current = currentAccount.homeAccountId;
        dispatch(setAzureAccount(currentAccount));
        
        dispatch(syncAzureUser())
          .unwrap()
          .then((userData) => {
            console.log("Sync successful:", userData);
          })
          .catch((error) => {
            console.error("Sync failed:", error);
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
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
            <span className="text-2xl font-black">A</span>
          </div>
        </div>

        <h2 className="text-heading text-3xl font-bold mb-2">Welcome Back</h2>
        <p className="text-muted mb-8 text-sm">Sign in to your corporate portal</p>

        {loading || inProgress !== "none" ? (
          <div className="text-main flex justify-center py-8">
            <Loader size="lg" text="Loading your profile..." />
          </div>
        ) : (
          <>
            <form onSubmit={handleLocalLogin} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input w-full pl-10 h-11 text-sm" 
                    placeholder="Enter your email"
                    required
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-input w-full pl-10 h-11 text-sm" 
                    placeholder="Enter your password"
                    required
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Link to="/auth/forgot-password" className="text-xs text-brand-primary font-semibold hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={localLoading}
                className="btn btn-primary w-full flex items-center justify-center gap-2 h-11 mt-2"
              >
                {localLoading ? <Loader size="sm" /> : <><LogIn size={18} /> Sign In</>}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-subtle"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface px-4 text-muted font-bold tracking-widest uppercase rounded-full border border-border-subtle shadow-sm">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              onClick={handleMicrosoftLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 h-11 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-all shadow-sm hover:shadow active:scale-95"
            >
              <img src="https://learn.microsoft.com/en-us/azure/active-directory/develop/media/howto-add-branding-in-azure-ad-apps/ms-symbollockup_mssymbol_19.png" alt="MS" className="h-5" />
              Microsoft SSO
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;