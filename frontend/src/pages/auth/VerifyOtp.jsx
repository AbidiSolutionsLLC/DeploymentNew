import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setAuthUser } from "../../slices/authSlice";
import api from "../../axios";
import { setUser } from "../../slices/userSlice";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const email = location?.state?.email;

  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      toast.error("Session expired. Please login again.");
      navigate("/auth/login");
    }
  }, [email, navigate]);

  const handleChange = (e, index) => {
    const { value } = e.target;
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otpValues];
      newOtp[index] = value;
      setOtpValues(newOtp);
      if (value && index < otpValues.length - 1) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasteData)) {
      const newOtp = pasteData.split("");
      setOtpValues(newOtp);
      inputRefs.current[otpValues.length - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = otpValues.join("");
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await api.post("/auth/verify-otp", { email, otp });
      const userData = res.data?.user;
      
      // Sync with both slices
      dispatch(setAuthUser(userData));
      dispatch(setUser(userData));
      
      localStorage.setItem("accessToken", res.data?.token);
      
      toast.success("Login successful!");
      navigate("/people/home", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-app px-4 w-full">
      <div className="glass-card p-8 shadow-md text-center max-w-md w-full">
        <h2 className="text-heading text-3xl font-bold mb-2">Verify OTP</h2>
        <p className="text-muted mb-8 text-sm">
          Enter the 6-digit code sent to <span className="font-semibold">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-4">
            {otpValues.map((value, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={value}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl glass-input focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || otpValues.join("").length !== 6}
            className="btn btn-primary w-full py-3 mt-6 text-sm sm:text-base font-semibold shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-brand-primary/40 active:scale-95"
          >
            {isSubmitting ? "Verifying..." : "Verify & Continue"}
          </button>
          
          <p className="text-muted text-sm mt-4">
            Didn't receive it? <Link to="/auth/login" className="text-brand-primary hover:underline">Go back and try again</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
