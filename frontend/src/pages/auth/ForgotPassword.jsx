import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../axios";
import { Mail, Send } from "lucide-react";
import Loader from "../../components/ui/Loader";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setIsSent(true);
      toast.success("Reset email sent! Check your inbox.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-app px-4 w-full">
      <div className="glass-card p-8 shadow-md text-center max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
            <span className="text-2xl font-black">?</span>
          </div>
        </div>

        <h2 className="text-heading text-3xl font-bold mb-2">Forgot Password</h2>
        <p className="text-muted mb-8 text-sm">
          {isSent ? "Check your email for the reset link" : "Enter your email to receive a reset link"}
        </p>

        {!isSent ? (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
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

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex items-center justify-center gap-2 h-11 mt-4"
            >
              {loading ? <Loader size="sm" /> : <><Send size={18} /> Send Reset Link</>}
            </button>
          </form>
        ) : (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl text-sm font-medium mb-6">
            We've sent a password reset link to <span className="font-bold">{email}</span>. Please check your inbox and spam folder.
          </div>
        )}

        <div className="mt-8">
          <Link to="/auth/login" className="text-xs text-brand-primary font-bold tracking-widest uppercase hover:underline">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;