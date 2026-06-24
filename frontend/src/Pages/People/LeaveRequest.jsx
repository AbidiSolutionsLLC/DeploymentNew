import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { applyForLeave, refreshUserData } from "../../slices/userSlice";
import { toast } from "react-toastify";
import GlassModal from "../../components/ui/GlassModal";

const ApplyLeaveModal = ({ isOpen, setIsOpen, onLeaveAdded }) => {
 const dispatch = useDispatch();
 const [leaveType, setLeaveType] = useState("");
 const [startDate, setStartDate] = useState("");
 const [endDate, setEndDate] = useState("");
 const [reason, setReason] = useState("");
 const [quotaError, setQuotaError] = useState("");
 const [daysRequested, setDaysRequested] = useState(0);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [errors, setErrors] = useState({});

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
 setErrors({});
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
 setErrors({
 leaveType: !leaveType ? "Please select an option." : null,
 startDate: !startDate ? "Please select a valid date." : null,
 endDate: !endDate ? "Please select a valid date." : null,
 });
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
 setErrors({});
 
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
    <GlassModal
      isOpen={isOpen}
      onClose={() => !isSubmitting && setIsOpen(false)}
      title="APPLY FOR LEAVE"
      maxWidth="max-w-md"
      footer={
        <div className="flex gap-4 w-full">
          <button
            type="button"
            onClick={() => !isSubmitting && setIsOpen(false)}
            disabled={isSubmitting}
            className="flex-1 px-6 py-4 rounded-2xl font-black text-[11px] text-muted uppercase tracking-widest hover:bg-surface transition-all disabled:opacity-50"
          >
            CANCEL
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={quotaError !== "" || !leaveType || !startDate || !endDate || isSubmitting}
            className={`flex-1 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg ${
              quotaError !== "" || !leaveType || !startDate || !endDate || isSubmitting
                ? "bg-slate-200 text-muted cursor-not-allowed shadow-none"
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
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* LEAVE TYPE */}
        <div>
          <label className="block text-[10px] font-black text-muted mb-2 uppercase tracking-widest">
            LEAVE TYPE*
          </label>
          <select
            className="w-full bg-brand-inner/40 border-none rounded-xl px-4 py-3.5 text-main font-medium focus:ring-2 focus:ring-brand-btnBlue/50 transition-all appearance-none"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            required
            disabled={isSubmitting}
          >
            <option value="">SELECT LEAVE TYPE</option>
            <option value="PTO">PTO (PAID TIME OFF)</option>
            <option value="Sick">SICK LEAVE</option>
          </select>
          {errors.leaveType && (
            <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.leaveType}</p>
          )}
          {availableBalance !== null && (
            <p className="mt-2 text-[11px] font-bold text-brand-stroke-green uppercase">
              AVAILABLE: {availableBalance} DAYS
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* START DATE */}
          <div>
            <label className="block text-[10px] font-black text-muted mb-2 uppercase tracking-widest">
              START DATE*
            </label>
            <input
              type="date"
              className="w-full bg-brand-inner/40 border-none rounded-xl px-4 py-3 text-main font-medium focus:ring-2 focus:ring-brand-btnBlue/50"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* END DATE */}
          <div>
            <label className="block text-[10px] font-black text-muted mb-2 uppercase tracking-widest">
              END DATE*
            </label>
            <input
              type="date"
              className="w-full bg-brand-inner/40 border-none rounded-xl px-4 py-3 text-main font-medium focus:ring-2 focus:ring-brand-btnBlue/50"
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
          <label className="block text-[10px] font-black text-muted mb-2 uppercase tracking-widest">
            REASON FOR LEAVE
          </label>
          <textarea
            className="w-full bg-brand-inner/40 border-none rounded-xl px-4 py-3 text-main font-medium focus:ring-2 focus:ring-brand-btnBlue/50 resize-none"
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
    </GlassModal>
  );
};

export default ApplyLeaveModal;