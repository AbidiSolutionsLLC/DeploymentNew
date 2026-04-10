import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { refreshUserData } from "../slices/userSlice";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ModernSelect from "./ui/ModernSelect";
import api from "../axios";
import { validateDescription, validateDateRange } from "../utils/validationUtils";
import { calculateWorkingDays, parseISOToLocalDate, formatDateForAPI } from "../utils/dateUtils";

const EditLeaveModal = ({ isOpen, setIsOpen, leaveData, onLeaveEdited }) => {
  const dispatch = useDispatch();
  const [leaveType, setLeaveType] = useState(leaveData?.leaveType || "");
  const [startDate, setStartDate] = useState(leaveData?.startDate ? new Date(leaveData.startDate) : null);
  const [endDate, setEndDate] = useState(leaveData?.endDate ? new Date(leaveData.endDate) : null);
  const [reason, setReason] = useState(leaveData?.reason || "");
  const [quotaError, setQuotaError] = useState("");
  const [daysRequested, setDaysRequested] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const { user: authUser } = useSelector((state) => state.auth || {});
  const { userInfo } = useSelector((state) => state.user || {});
  const userData = userInfo || authUser?.user || authUser || {};
  const userLeaves = userData.leaves || {};

  const calculateDays = (start, end) => {
    return calculateWorkingDays(start, end);
  };

  const getLeaveBalanceKey = (leaveType) => {
    if (!leaveType || leaveType === "") return "";
    const mapping = { "PTO": "pto", "Sick": "sick" };
    return mapping[leaveType] || leaveType.toLowerCase();
  };

  useEffect(() => {
    if (isOpen && leaveData) {
      setLeaveType(leaveData.leaveType || "");
      setStartDate(leaveData.startDate ? parseISOToLocalDate(leaveData.startDate) : null);
      setEndDate(leaveData.endDate ? parseISOToLocalDate(leaveData.endDate) : null);
      setReason(leaveData.reason || "");
      setQuotaError("");
      setErrors({});
    }
  }, [isOpen, leaveData]);

  useEffect(() => {
    if (leaveType && startDate && endDate) {
      const days = calculateDays(startDate, endDate);
      setDaysRequested(days);
      const balanceKey = getLeaveBalanceKey(leaveType);
      const availableBalance = userLeaves[balanceKey] || 0;

      if (days > availableBalance) {
        setQuotaError(`INSUFFICIENT BALANCE. AVAILABLE: ${availableBalance} DAYS`);
      } else {
        setQuotaError("");
      }
    } else {
      setDaysRequested(0);
      setQuotaError("");
    }
  }, [leaveType, startDate, endDate, userLeaves]);

  const validateField = (name, value) => {
    let error = null;
    switch (name) {
      case "leaveType":
        if (!value || value === "") error = "Please select an option.";
        break;
      case "startDate":
        if (!value) error = "Please select a valid date.";
        break;
      case "endDate":
        if (!value) error = "Please select a valid date.";
        const rangeError = validateDateRange(startDate, value);
        if (rangeError) error = rangeError;
        break;
      case "reason":
        error = validateDescription(value, { min: 20, max: 500, required: true });
        break;
      default:
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const typeError = validateField("leaveType", leaveType);
    const startError = validateField("startDate", startDate);
    const endError = validateField("endDate", endDate);
    const reasonError = validateField("reason", reason);

    if (typeError || startError || endError || reasonError || quotaError) {
      toast.error("PLEASE FIX VALIDATION ERRORS BEFORE SUBMITTING.");
      return;
    }

    setIsSubmitting(true);

    try {
      const leaveDataUpdate = {
        leaveType,
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
        reason,
      };

      const response = await api.put(`/leaves/${leaveData._id}`, leaveDataUpdate);
      toast.success("Leave request updated successfully");

      if (userData?._id) {
        dispatch(refreshUserData(userData._id));
      }

      setIsOpen(false);
      if (onLeaveEdited) onLeaveEdited();

    } catch (error) {
      const errorMsg = error.response?.data?.message || "FAILED TO UPDATE";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target.closest('#portal-root') || e.target.closest('.react-datepicker')) return;
    if (!isSubmitting && e.target === e.currentTarget) {
      handleCancel();
    }
  };

  const handleCancel = () => {
    const hasData = leaveType || startDate || endDate || reason;
    if (hasData) {
      const confirmed = window.confirm('Are you sure? Unsaved changes will be lost.');
      if (!confirmed) return;
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const balanceKey = getLeaveBalanceKey(leaveType);
  const availableBalance = leaveType ? (userLeaves[balanceKey] || 0) : null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4 sm:p-6"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-fadeIn overflow-hidden">
        <button
          onClick={() => !isSubmitting && setIsOpen(false)}
          disabled={isSubmitting}
          className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light z-10 disabled:opacity-50"
        >
          &times;
        </button>

        <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 text-center flex-shrink-0">
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-widest uppercase">
            EDIT LEAVE REQUEST
          </h2>
        </div>

        <form
          id="editLeaveForm"
          className="p-6 sm:p-10 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar"
          onSubmit={handleSubmit}
        >
          <div>
            <div onClick={(e) => e.stopPropagation()} className="relative">
              <ModernSelect
                label="Leave Type"
                name="leaveType"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                required
                placeholder="SELECT TYPE"
                options={[
                  { value: '', label: 'SELECT TYPE' },
                  { value: 'PTO', label: 'PTO (PAID TIME OFF)' },
                  { value: 'Sick', label: 'SICK LEAVE' }
                ]}
                className="w-full"
                disabled={isSubmitting}
              />
              {errors.leaveType && (
                <p className="text-xs text-red-500 mt-1">{errors.leaveType}</p>
              )}
            </div>
            {availableBalance !== null && (
              <p className="mt-2 text-[10px] font-bold text-emerald-500 uppercase tracking-tight">
                AVAILABLE BALANCE: {availableBalance} DAYS
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                START DATE*
              </label>
              <DatePicker
                selected={startDate}
                onChange={(date) => {
                  if (endDate && date > endDate) {
                    setErrors(prev => ({ ...prev, startDate: 'Start date must be before end date' }));
                    toast.error("Start date should be less than end date.");
                    return;
                  }
                  setErrors(prev => ({ ...prev, startDate: null }));
                  setStartDate(date);
                }}
                className={`w-full bg-white border ${errors.startDate ? 'border-red-400' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50 cursor-pointer`}
                placeholderText="Select Date"
                dateFormat="yyyy-MM-dd"
                required
                disabled={isSubmitting}
                onBlur={() => validateField("startDate", startDate)}
                popperProps={{ strategy: "fixed" }}
                portalId="portal-root"
              />
              {errors.startDate && (
                <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                END DATE*
              </label>
              <DatePicker
                selected={endDate}
                onChange={(date) => {
                  if (startDate && date < startDate) {
                    setErrors(prev => ({ ...prev, endDate: 'End date must be after start date' }));
                    toast.error("End date should be greater than start date.");
                    return;
                  }
                  setErrors(prev => ({ ...prev, endDate: null }));
                  setEndDate(date);
                }}
                className={`w-full bg-white border ${errors.endDate ? 'border-red-400' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50 cursor-pointer`}
                placeholderText="Select Date"
                dateFormat="yyyy-MM-dd"
                required
                disabled={isSubmitting}
                onBlur={() => validateField("endDate", endDate)}
                popperProps={{ strategy: "fixed" }}
                portalId="portal-root"
              />
              {errors.endDate && (
                <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          {daysRequested > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TOTAL DAYS</span>
              <span className="text-sm font-bold text-slate-700">{daysRequested} DAYS</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              REASON FOR LEAVE
            </label>
            <textarea
              className={`w-full bg-white border ${errors.reason ? 'border-red-400' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300 resize-none disabled:opacity-50`}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={(e) => validateField("reason", e.target.value)}
              placeholder="e.g. family vacation"
              disabled={isSubmitting}
            ></textarea>
            <p className="text-xs text-slate-400 text-right mt-1">
              {reason.length}/500
            </p>
            {errors.reason && (
              <p className="text-xs text-red-500 mt-1">{errors.reason}</p>
            )}
          </div>

          {quotaError && (
            <div className="bg-red-50 p-3 rounded-xl border border-red-100">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-tight text-center">
                {quotaError}
              </p>
            </div>
          )}

          <div className="h-4"></div>
        </form>

        <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex gap-3 sm:gap-4 bg-white flex-shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 py-3 sm:py-4 font-black text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            CANCEL
          </button>
          <button
            type="submit"
            form="editLeaveForm"
            disabled={quotaError !== "" || Object.values(errors).some(Boolean) || !leaveType || !startDate || !endDate || isSubmitting}
            className={`flex-1 py-3 sm:py-4 text-white rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-lg transition-all ${
              quotaError !== "" || Object.values(errors).some(Boolean) || !leaveType || !startDate || !endDate || isSubmitting
                ? "bg-slate-300 shadow-none cursor-not-allowed"
                : "bg-[#64748b] shadow-slate-100 hover:brightness-110 active:scale-95"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>UPDATING...</span>
              </div>
            ) : (
              "UPDATE REQUEST"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditLeaveModal;
