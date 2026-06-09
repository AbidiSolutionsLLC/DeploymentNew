import React, { useState, useRef, useEffect } from "react";
import api from "../axios";
import { FaEdit, FaPlus, FaTrash, FaEnvelope, FaCheck } from "react-icons/fa";
import { toast } from "react-toastify";
import CreateDepartmentModal from "./CreateDepartmentModal";
import ModernSelect from "./ui/ModernSelect";
import ModernDatePicker from "./ui/ModernDatePicker";
import { validateText, validateEmail, validatePhone, sanitizeText } from "../utils/validationUtils";

const UserDetailModal = ({ user, currentUser, isOpen, onClose, onUserUpdated, allManagers, allDepartments }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const modalRef = useRef(null);

  // ================== INIT FORM ==================
  useEffect(() => {
    if (user) {
      const [fName, ...lNameParts] = (user.name || "").split(" ");
      setFormData({
        firstName: fName || "",
        lastName: lNameParts.join(" ") || "",
        email: user.email || "",
        designation: user.designation || "",
        department: user.department?._id || "",
        reportsTo: user.reportsTo?._id || "",
        role: user.role || "Employee",
        empType: user.empType || "Permanent",
        endDate: user.endDate?.split("T")[0] || "",
        joiningDate: user.joiningDate?.split("T")[0] || "",
        phoneNumber: user.phoneNumber || "",
        branch: user.branch || "Karachi",
        timeZone: user.timeZone || "Asia/Karachi",
        empStatus: user.empStatus || "Pending",
        isTechnician: user.isTechnician || false,
        hourlyWage: user.hourlyWage || ""
      });
      setErrors({});
    }
  }, [user]);

  // ================== VALIDATION ==================
  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "firstName":
      case "lastName":
        error = validateText(value);
        if (!error && value.length < 2) error = "Min 2 characters";
        if (!error && !/^[a-zA-Z\s'-]+$/.test(value)) error = "Only letters allowed.";
        break;
      case "email":
        error = validateEmail(value);
        break;
      case "phoneNumber":
        error = validatePhone(value, false); // Optional in edit? The rules said optional for phone.
        break;
      case "designation":
        error = value.trim() ? "" : "Designation is required";
        break;
      case "branch":
        error = value.trim() ? "" : "Branch is required";
        break;
      case "hourlyWage":
        error = (value !== "" && value >= 0) ? "" : "Valid wage required";
        break;
      default:
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === "empType" && value !== "Contractor" && value !== "Intern") {
        updated.endDate = "";
      }
      return updated;
    });
    validateField(name, value);
  };

  const validateForm = () => {
    const fieldsToValidate = ["firstName", "lastName", "email", "phoneNumber", "designation", "branch", "hourlyWage"];
    const newErrors = {};
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================== SUBMIT ==================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent editing oneself
    if (user && currentUser && user._id === currentUser._id) {
      toast.error("You cannot edit yourself", { toastId: "self-edit-error" });
      setIsEditing(false);
      return;
    }

    if (!validateForm()) return toast.error("Fix validation errors");

    setIsLoading(true);
    try {
      const changedFields = {};

      Object.keys(formData).forEach(key => {
        let original = user[key];
        let current = formData[key];

        if (key === "firstName" || key === "lastName") {
          // Special handling for split name
          const fullName = sanitizeText(`${formData.firstName} ${formData.lastName}`);
          if (fullName !== user.name) changedFields.name = fullName;
          return;
        }

        if (key === "department") original = user.department?._id || "";
        if (key === "reportsTo") original = user.reportsTo?._id || "";
        if (key === "joiningDate") original = user.joiningDate?.split("T")[0] || "";
        if (key === "endDate") original = user.endDate?.split("T")[0] || "";
        if (key === "hourlyWage") original = user.hourlyWage || "";

        if (original == null) original = "";
        if (current == null) current = "";

        if (key === "isTechnician") {
          if (current !== original) changedFields[key] = current;
        }
        else if (key === "hourlyWage") {
          if (parseFloat(current) !== parseFloat(original)) changedFields[key] = parseFloat(current);
        }
        else {
          if (String(current) !== String(original)) changedFields[key] = current;
        }
      });

      if (!Object.keys(changedFields).length) {
        toast.info("No changes to save");
        setIsEditing(false);
        return;
      }

      await api.put(`/users/${user._id}`, changedFields);
      onUserUpdated();
      onClose();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ================== ACTIONS ==================
  const handleDeleteUser = async () => {
    if (!window.confirm(`Delete ${user.name}?`)) return;
    setIsDeleting(true);
    try {
      await api.delete(`/users/${user._id}`);
      toast.success("Deleted");
      onUserUpdated("delete");
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResendInvite = async () => {
    setIsResending(true);
    try {
      await api.post(`/users/${user._id}/resend-invite`);
      toast.success("Invite resent");
    } finally {
      setIsResending(false);
    }
  };

  const handleBackdropClick = (e) => {
    // If clicking inside the date picker portal, don't close the modal
    if (e.target.closest('#portal-root') || e.target.closest('.react-datepicker')) return;
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
      setIsEditing(false);
    }
  };

  // ================== FIELD RENDER ==================
  const renderField = (label, name, value, type = "text", options = [], required = true) => {
    const error = errors[name];
    const formattedOptions = options.map(opt => ({
      value: opt.value || opt._id,
      label: opt.label || opt.name?.toUpperCase()
    }));

    if (isEditing) {
      if (type === "select") {
        if (name === "department") {
          return (
            <div className="flex gap-2 items-end">
              <ModernSelect label={label} name={name} value={value} onChange={handleChange} options={formattedOptions} required={required} placeholder={`SELECT ${label}`} className="flex-1" />
              <button type="button" onClick={() => setIsDeptModalOpen(true)} className="px-4 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 h-[46px] flex items-center">
                <FaPlus />
              </button>
            </div>
          );
        }
        return <ModernSelect label={label} name={name} value={value} onChange={handleChange} options={formattedOptions} required={required} placeholder={`SELECT ${label}`} />;
      }

      if (type === "date") return <ModernDatePicker label={label} name={name} value={value} onChange={handleChange} />;

      return (
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase">{label}</label>
          <input
            type={type}
            name={name}
            value={value}
            onChange={handleChange}
            className={`w-full bg-white border ${error ? "border-red-300" : "border-slate-200"} rounded-xl px-4 py-3`}
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>
      );
    }

    // VIEW MODE
    return (
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase">{label}</label>
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
          {name === "department" ? allDepartments.find(d => d._id === value)?.name :
            name === "reportsTo" ? allManagers.find(m => m._id === value)?.name :
              (name === "joiningDate" || name === "endDate") ? (value ? new Date(value).toLocaleDateString() : "-") :
                name === "hourlyWage" ? `$${value}/hr` :
                  value || "-"}
        </div>
      </div>
    );
  };

  if (!isOpen || !user) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={handleBackdropClick}>
        <div ref={modalRef} className="modal-container-lg">
          {/* HEADER */}
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">{user.name}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">User Profile & Access Control</p>
            </div>
            <div className="flex items-center gap-3">
              {!isEditing && (
                <>
                  <button onClick={handleResendInvite} className="px-4 py-2.5 bg-amber-50 text-amber-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all">Invite</button>
                  <button onClick={handleDeleteUser} className="px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all">Delete</button>
                </>
              )}
              <button onClick={() => setIsEditing(!isEditing)} className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isEditing ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light">&times;</button>
            </div>
          </div>

          {/* BODY */}
          <div className="modal-body-scroll bg-white">
            <form id="editUserForm" onSubmit={handleSubmit} className="space-y-10">
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-px bg-slate-100 flex-1"></div>
                  <h3 className="font-black text-blue-500 text-[10px] uppercase tracking-[0.2em] px-2">Personal Information</h3>
                  <div className="h-px bg-slate-100 flex-1"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {isEditing ? (
                    <>
                      {renderField("First Name", "firstName", formData.firstName)}
                      {renderField("Last Name", "lastName", formData.lastName)}
                    </>
                  ) : (
                    <div className="col-span-2">{renderField("Full Name", "name", user.name)}</div>
                  )}
                  {renderField("Email Address", "email", formData.email, "email")}
                  {renderField("Phone Number", "phoneNumber", formData.phoneNumber)}
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-px bg-slate-100 flex-1"></div>
                  <h3 className="font-black text-blue-500 text-[10px] uppercase tracking-[0.2em] px-2">Employment & Role</h3>
                  <div className="h-px bg-slate-100 flex-1"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {renderField("Employment Status", "empStatus", formData.empStatus, "select", ["Active", "Inactive", "Pending"].map(v => ({ value: v, label: v })))}
                  {renderField("Access Level (Role)", "role", formData.role, "select", ["Employee", "Manager", "HR", "Admin", "Super Admin"].map(v => ({ value: v, label: v })))}
                  {renderField("Job Designation", "designation", formData.designation)}
                  {renderField("Hourly Wage ($)", "hourlyWage", formData.hourlyWage, "number")}
                  {renderField("Contract Type", "empType", formData.empType, "select", ["Permanent", "Contractor", "Intern", "Part Time"].map(v => ({ value: v, label: v })))}
                  {renderField("Primary Department", "department", formData.department, "select", allDepartments)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="sm:col-span-1">{renderField("Reporting Manager", "reportsTo", formData.reportsTo, "select", allManagers)}</div>
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Technician Mode</label>
                    <div
                      onClick={() => isEditing && setFormData((p) => ({ ...p, isTechnician: !p.isTechnician }))}
                      className={`flex items-center gap-3 px-4 py-3 border rounded-xl transition-all ${
                        isEditing ? "cursor-pointer" : "cursor-default opacity-80"
                      } ${
                        formData.isTechnician ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200"
                      }`}
                    >
                      <div className={`w-5 h-5 border rounded flex items-center justify-center transition-all ${
                        formData.isTechnician ? "bg-blue-500 border-blue-500" : "bg-white border-slate-300"
                      }`}>
                        {formData.isTechnician && <FaCheck className="text-white w-2.5 h-2.5" />}
                      </div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Assign as Technician</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-px bg-slate-100 flex-1"></div>
                  <h3 className="font-black text-blue-500 text-[10px] uppercase tracking-[0.2em] px-2">Logistics & Dates</h3>
                  <div className="h-px bg-slate-100 flex-1"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-6">
                  {renderField("Joining Date", "joiningDate", formData.joiningDate, "date")}
                  {(formData.empType === "Contractor" || formData.empType === "Intern") && renderField("Contract End Date", "endDate", formData.endDate, "date")}
                  {renderField("Office Branch", "branch", formData.branch)}
                  {renderField("Work Timezone", "timeZone", formData.timeZone, "select", ["Asia/Karachi", "America/New_York", "Europe/London", "Asia/Dubai"].map(v => ({ value: v, label: v })))}
                </div>
              </section>
            </form>
          </div>

          {/* FOOTER */}
          {isEditing && (
            <div className="p-8 border-t border-slate-100 flex justify-end gap-4 bg-slate-50/50 shrink-0">
              <button 
                type="button"
                onClick={() => setIsEditing(false)} 
                className="px-8 py-3.5 font-black text-[11px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                DISCARD CHANGES
              </button>
              <button 
                form="editUserForm"
                onClick={handleSubmit} 
                disabled={isLoading}
                className="btn btn-primary px-10 py-3.5 shadow-lg shadow-blue-100"
              >
                {isLoading ? "SAVING..." : "SAVE CHANGES"}
              </button>
            </div>
          )}
        </div>
      </div>

      <CreateDepartmentModal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        onDepartmentCreated={onUserUpdated}
        potentialManagers={allManagers}
      />
    </>
  );
};

export default UserDetailModal;