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
import GlassModal from "./ui/GlassModal";
import GlassButton from "./ui/GlassButton";

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
 if (e) e.preventDefault();
 const typeError = validateField("leaveType", leaveType);
 const startError = validateField("startDate", startDate);
 const endError = validateField("endDate", endDate);
 const reasonError = validateField("reason", reason);

 if (typeError || startError || endError || reasonError || quotaError || !leaveType || !startDate || !endDate) {
 toast.error("PLEASE FIX VALIDATION ERRORS BEFORE SUBMITTING.");
 validateField("leaveType", leaveType);
 validateField("startDate", startDate);
 validateField("endDate", endDate);
 validateField("reason", reason);
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

 const handleCancel = () => {
 const hasData = leaveType || startDate || endDate || reason;
 if (hasData) {
 const confirmed = window.confirm('Are you sure? Unsaved changes will be lost.');
 if (!confirmed) return;
 }
 setIsOpen(false);
 };

 const balanceKey = getLeaveBalanceKey(leaveType);
 const availableBalance = leaveType ? (userLeaves[balanceKey] || 0) : null;

 return (
 <GlassModal
 isOpen={isOpen}
 onClose={() => !isSubmitting && handleCancel()}
 title="EDIT LEAVE REQUEST"
 maxWidth="max-w-md"
 footer={
 <>
 <GlassButton variant="ghost" onClick={handleCancel} disabled={isSubmitting}>
 CANCEL
 </GlassButton>
 <GlassButton 
 variant="primary" 
 onClick={handleSubmit} 
 isLoading={isSubmitting}
 disabled={quotaError !== "" || Object.values(errors).some(Boolean)}
 >
 {isSubmitting ? "UPDATING..." : "UPDATE REQUEST"}
 </GlassButton>
 </>
 }
 >
 <form id="editLeaveForm" onSubmit={handleSubmit} className="space-y-6">
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
 error={errors.leaveType}
 />
 {errors.leaveType && (
 <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.leaveType}</p>
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
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
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
 className={`glass-input w-full cursor-pointer ${errors.startDate ? 'border-red-400 ring-1 ring-red-400' : ''} ${isSubmitting ? 'opacity-50' : ''}`}
 placeholderText="Select Date"
 dateFormat="yyyy-MM-dd"
 required
 disabled={isSubmitting}
 onBlur={() => validateField("startDate", startDate)}
 popperProps={{ strategy: "fixed" }}
 portalId="portal-root"
 />
 {errors.startDate && (
 <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.startDate}</p>
 )}
 </div>

 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
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
 className={`glass-input w-full cursor-pointer ${errors.endDate ? 'border-red-400 ring-1 ring-red-400' : ''} ${isSubmitting ? 'opacity-50' : ''}`}
 placeholderText="Select Date"
 dateFormat="yyyy-MM-dd"
 required
 disabled={isSubmitting}
 onBlur={() => validateField("endDate", endDate)}
 popperProps={{ strategy: "fixed" }}
 portalId="portal-root"
 />
 {errors.endDate && (
 <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.endDate}</p>
 )}
 </div>
 </div>

 {daysRequested > 0 && (
 <div className="bg-surface/50 dark:bg-slate-800/50 p-4 rounded-xl border border-dashed border-border-subtle dark:border-slate-700 flex justify-between items-center">
 <span className="text-[10px] font-black text-muted dark:text-muted uppercase tracking-widest">TOTAL DAYS</span>
 <span className="text-sm font-bold text-heading dark:text-white">{daysRequested} DAYS</span>
 </div>
 )}

 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
 REASON FOR LEAVE
 </label>
 <textarea
 className={`glass-input w-full resize-none ${errors.reason ? 'border-red-400 ring-1 ring-red-400' : ''} ${isSubmitting ? 'opacity-50' : ''}`}
 rows={3}
 value={reason}
 onChange={(e) => setReason(e.target.value)}
 onBlur={(e) => validateField("reason", e.target.value)}
 placeholder="e.g. family vacation"
 disabled={isSubmitting}
 ></textarea>
 <p className="text-[10px] text-muted dark:text-muted text-right mt-1 uppercase tracking-widest">
 {reason.length}/500
 </p>
 {errors.reason && (
 <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.reason}</p>
 )}
 </div>

 {quotaError && (
 <div className="bg-red-50/50 dark:bg-red-900/20 p-3 rounded-xl border border-red-200 dark:border-red-800">
 <p className="text-[10px] font-black text-red-500 dark:text-red-400 uppercase tracking-tight text-center">
 {quotaError}
 </p>
 </div>
 )}
 </form>
 </GlassModal>
 );
};

export default EditLeaveModal;
