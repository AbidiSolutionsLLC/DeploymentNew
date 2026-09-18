import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../axios";
import { Lock, KeyRound } from "lucide-react";
import Loader from "../../components/ui/Loader";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [email, setEmail] = useState("");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const decodedToken = decodeURIComponent(token);
        const res = await api.get(`/auth/verify-reset-token/${decodedToken}`);
        setIsValidToken(true);
        setEmail(res.data?.email || "your account");
      } catch (err) {
        console.error('Token verification error:', err);
        toast.error("Invalid or expired reset link.");
      } finally {
        setIsValidating(false);
      }
    };
    if (token) verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (!passwordRegex.test(password)) {
      toast.error("Password must be 8+ chars, 1 uppercase, 1 number & 1 special char.");
      return;
    }

    setIsSubmitting(true);
    try {
      const decodedToken = decodeURIComponent(token);
      await api.post(`/auth/reset-password/${decodedToken}`, { password });
      toast.success("Password reset successful! Redirecting to login...");
      setTimeout(() => navigate("/auth/login"), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Password reset failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-app">
        <Loader size="lg" text="Verifying your secure link..." />
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-app px-4 w-full">
        <div className="glass-card p-8 shadow-md text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-inner mx-auto mb-6">
            <span className="text-2xl font-black">!</span>
          </div>
          <h2 className="text-heading text-2xl font-bold mb-4">Invalid Link</h2>
          <p className="text-muted text-sm mb-8">This password reset link is invalid or has expired.</p>
          <Link to="/auth/forgot-password" className="btn btn-primary w-full flex items-center justify-center">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-app px-4 w-full">
      <div className="glass-card p-8 shadow-md text-center max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
            <KeyRound size={28} strokeWidth={2.5} />
          </div>
        </div>

        <h2 className="text-heading text-3xl font-bold mb-2">Reset Password</h2>
        <p className="text-muted mb-8 text-sm">Create a new password for <span className="font-semibold text-main">{email}</span></p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">New Password</label>
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full pl-10 h-11 text-sm" 
                placeholder="Enter new password"
                required
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            </div>
            <p className="text-[10px] text-muted/70 ml-1 mt-1">Must be 8+ chars, 1 uppercase, 1 number & 1 special char.</p>
          </div>
          
          <div className="space-y-1 mt-4">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Confirm Password</label>
            <div className="relative">
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glass-input w-full pl-10 h-11 text-sm" 
                placeholder="Confirm new password"
                required
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !password || !confirmPassword}
            className="btn btn-primary w-full flex items-center justify-center gap-2 h-11 mt-6 shadow-lg shadow-brand-primary/20 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? <Loader size="sm" /> : "Save New Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;