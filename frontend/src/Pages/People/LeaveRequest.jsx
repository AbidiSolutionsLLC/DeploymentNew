import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { applyForLeave, refreshUserData } from "../../slices/userSlice";
import { toast } from "react-toastify";

const ApplyLeaveModal = ({ isOpen, setIsOpen, onLeaveAdded }) => {
  const dispatch = useDispatch();
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [quotaError, setQuotaError] = useState("");
  const [daysRequested, setDaysRequested] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get user data from both auth and user slices
  const { user: authUser } = useSelector((state) => state.auth);
  const { userInfo, loading, error } = useSelector((state) => state.user);
  
  // Use userInfo if available, otherwise fall back to auth user
  const userData = userInfo || authUser?.user || authUser;
  const userLeaves = userData?.leaves || {};

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const diffTime = Math.abs(endDateObj - startDateObj);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getLeaveBalanceKey = (leaveType) => {
    const mapping = { "PTO": "pto", "Sick": "sick" };
    return mapping[leaveType] || leaveType.toLowerCase();
  };

  // Clear error when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setLeaveType("");
      setStartDate("");
      setEndDate("");
      setReason("");
      setQuotaError("");
      setDaysRequested(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (leaveType && startDate && endDate) {
      const days = calculateDays(startDate, endDate);
      setDaysRequested(days);
      const balanceKey = getLeaveBalanceKey(leaveType);
      const availableBalance = userLeaves[balanceKey] || 0;

      if (days > availableBalance) {
        setQuotaError(`INSUFFICIENT LEAVE BALANCE. AVAILABLE: ${availableBalance} DAYS`);
      } else {
        setQuotaError("");
      }
    } else {
      setDaysRequested(0);
      setQuotaError("");
    }
  }, [leaveType, startDate, endDate, userLeaves]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!leaveType || !startDate || !endDate) {
      toast.error("PLEASE FILL ALL REQUIRED FIELDS.");
      return;
    }
    
    if (quotaError) {
      toast.error("INSUFFICIENT LEAVE BALANCE");
      return;
    }

    setIsSubmitting(true);

    try {
      const leaveData = {
        leaveType,
        startDate,
        endDate,
        reason,
        userId: userData?._id || userData?.id,
        days: daysRequested
      };

      // Dispatch the applyForLeave action
      const result = await dispatch(applyForLeave(leaveData)).unwrap();
      
      toast.success("LEAVE REQUEST SUBMITTED SUCCESSFULLY");
      
      // Refresh user data to get updated balances
      if (userData?._id) {
        dispatch(refreshUserData(userData._id));
      }
      
      setIsOpen(false);
      
      // Reset form
      setLeaveType("");
      setStartDate("");
      setEndDate("");
      setReason("");
      setQuotaError("");
      setDaysRequested(0);
      
      // Call the callback if provided
      if (onLeaveAdded) {
        onLeaveAdded();
      }
      
    } catch (error) {
      toast.error(error || "FAILED TO SUBMIT LEAVE REQUEST");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const balanceKey = getLeaveBalanceKey(leaveType);
  const availableBalance = leaveType ? (userLeaves[balanceKey] || 0) : null;

  return (
    <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm z-[100] flex justify-end">
      <div className="w-full sm:w-[450px] bg-white h-full shadow-2xl flex flex-col animate-fade-left animate-duration-300">
        
        {/* HEADER */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-800 tracking-widest uppercase">
            APPLY FOR LEAVE
          </h2>
          <button
            onClick={() => !isSubmitting && setIsOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form className="p-8 flex-1 space-y-6 overflow-y-auto" onSubmit={handleSubmit}>
          
          {/* LEAVE TYPE */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              LEAVE TYPE*
            </label>
            <select
              className="w-full bg-brand-inner/40 border-none rounded-xl px-4 py-3.5 text-slate-700 font-medium focus:ring-2 focus:ring-brand-btnBlue/50 transition-all appearance-none"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              required
              disabled={isSubmitting}
            >
              <option value="">SELECT LEAVE TYPE</option>
              <option value="PTO">PTO (PAID TIME OFF)</option>
              <option value="Sick">SICK LEAVE</option>
            </select>
            {availableBalance !== null && (
              <p className="mt-2 text-[11px] font-bold text-brand-stroke-green uppercase">
                AVAILABLE: {availableBalance} DAYS
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* START DATE */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                START DATE*
              </label>
              <input
                type="date"
                className="w-full bg-brand-inner/40 border-none rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-brand-btnBlue/50"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* END DATE */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                END DATE*
              </label>
              <input
                type="date"
                className="w-full bg-brand-inner/40 border-none rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-brand-btnBlue/50"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {daysRequested > 0 && (
            <div className="bg-brand-timer/30 p-3 rounded-lg flex justify-between items-center">
              <span className="text-[10px] font-black text-brand-stroke-blue uppercase">TOTAL REQUESTED</span>
              <span className="text-sm font-bold text-brand-stroke-blue">{daysRequested} DAYS</span>
            </div>
          )}

          {/* REASON */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              REASON FOR LEAVE
            </label>
            <textarea
              className="w-full bg-brand-inner/40 border-none rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-brand-btnBlue/50 resize-none"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ENTER REASON..."
              disabled={isSubmitting}
            ></textarea>
          </div>

          {/* ERROR DISPLAY */}
          {quotaError && (
            <div className="bg-brand-badge-rose/20 p-4 rounded-xl border border-brand-stroke-red/10">
              <p className="text-[10px] font-black text-brand-stroke-red tracking-tighter uppercase text-center">
                {quotaError}
              </p>
            </div>
          )}

          {/* API ERROR DISPLAY */}
          {error && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-200">
              <p className="text-[10px] font-black text-red-600 tracking-tighter uppercase text-center">
                {error}
              </p>
            </div>
          )}
        </form>

        {/* FOOTER ACTIONS */}
        <div className="p-8 border-t border-slate-100 flex gap-4 bg-slate-50/50">
          <button
            type="button"
            onClick={() => !isSubmitting && setIsOpen(false)}
            disabled={isSubmitting}
            className="flex-1 px-6 py-4 rounded-2xl font-black text-[11px] text-slate-400 uppercase tracking-widest hover:bg-slate-100 transition-all disabled:opacity-50"
          >
            CANCEL
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={quotaError !== "" || !leaveType || !startDate || !endDate || isSubmitting}
            className={`flex-1 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg ${
              quotaError !== "" || !leaveType || !startDate || !endDate || isSubmitting
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-brand-btnGreen text-brand-stroke-green hover:opacity-90 shadow-brand-btnGreen/20"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>SUBMITTING...</span>
              </div>
            ) : (
              "SUBMIT REQUEST"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplyLeaveModal;