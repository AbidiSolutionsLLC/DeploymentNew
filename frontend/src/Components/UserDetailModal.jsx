import React, { useState, useRef, useEffect } from "react";
import api from "../axios";
import { FaEdit, FaPlus, FaTrash, FaEnvelope, FaCheck } from "react-icons/fa";
import { toast } from "react-toastify";
import CreateDepartmentModal from "./CreateDepartmentModal";
import ModernSelect from "./ui/ModernSelect";
import ModernDatePicker from "./ui/ModernDatePicker";

const UserDetailModal = ({ user, isOpen, onClose, onUserUpdated, allManagers, allDepartments }) => {
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
      setFormData({
        name: user.name || "",
        email: user.email || "",
        designation: user.designation || "",
        department: user.department?._id || "",
        reportsTo: user.reportsTo?._id || "",
        role: user.role || "Employee",
        empType: user.empType || "Permanent",
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
    switch (name) {
      case "name": return value.trim() ? "" : "Name is required";
      case "email": return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Valid email is required";
      case "phoneNumber": return value.trim() ? "" : "Phone number is required";
      case "designation": return value.trim() ? "" : "Designation is required";
      case "department": return value ? "" : "Department is required";
      case "joiningDate": return value ? "" : "Joining date is required";
      case "branch": return value.trim() ? "" : "Branch is required";
      case "hourlyWage": return value !== "" && value >= 0 ? "" : "Valid hourly wage is required";
      default: return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateForm = () => {
    const newErrors = {};
    ["name", "email", "phoneNumber", "designation", "department", "joiningDate", "branch", "hourlyWage"].forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================== SUBMIT ==================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return toast.error("Fix validation errors");

    setIsLoading(true);
    try {
      const changedFields = {};

      Object.keys(formData).forEach(key => {
        let original = user[key];
        let current = formData[key];

        if (key === "department") original = user.department?._id || "";
        if (key === "reportsTo") original = user.reportsTo?._id || "";
        if (key === "joiningDate") original = user.joiningDate?.split("T")[0] || "";
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
           name === "joiningDate" ? (value ? new Date(value).toLocaleDateString() : "-") :
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
        <div ref={modalRef} className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">

          {/* HEADER */}
          <div className="bg-white border-b p-6 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">{user.name}</h2>
            <div className="flex gap-2">
              {!isEditing && <button onClick={handleResendInvite} className="px-3 py-2 bg-amber-50 text-amber-600 rounded-xl">Invite</button>}
              {!isEditing && <button onClick={handleDeleteUser} className="px-3 py-2 bg-red-50 text-red-600 rounded-xl">Delete</button>}
              <button onClick={() => setIsEditing(!isEditing)} className="px-3 py-2 bg-blue-50 text-blue-600 rounded-xl">Edit</button>
              <button onClick={onClose} className="text-xl text-slate-400">&times;</button>
            </div>
          </div>

          {/* BODY */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">

            <div>
              <h3 className="font-bold text-slate-400 text-xs uppercase">Personal</h3>
              <div className="grid grid-cols-3 gap-4">
                {renderField("Full Name", "name", formData.name)}
                {renderField("Email", "email", formData.email, "email")}
                {renderField("Phone", "phoneNumber", formData.phoneNumber)}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-400 text-xs uppercase">Employment</h3>
              <div className="grid grid-cols-3 gap-4">
                {renderField("Status", "empStatus", formData.empStatus, "select", ["Active","Inactive","Pending"].map(v=>({value:v,label:v})))}
                {renderField("Role", "role", formData.role, "select", ["Employee","Manager","HR","Admin","Super Admin"].map(v=>({value:v,label:v})))}
                {renderField("Designation", "designation", formData.designation)}
                {renderField("Hourly Wage", "hourlyWage", formData.hourlyWage, "number")}
                {renderField("Type", "empType", formData.empType, "select", ["Permanent","Contractor","Intern","Part Time"].map(v=>({value:v,label:v})))}
                {renderField("Department", "department", formData.department, "select", allDepartments)}
                {renderField("Reports To", "reportsTo", formData.reportsTo, "select", allManagers)}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-400 text-xs uppercase">Company</h3>
              <div className="grid grid-cols-3 gap-4">
                {renderField("Joining Date", "joiningDate", formData.joiningDate, "date")}
                {renderField("Branch", "branch", formData.branch)}
                {renderField("Timezone", "timeZone", formData.timeZone, "select", ["Asia/Karachi","America/New_York","Europe/London","Asia/Dubai"].map(v=>({value:v,label:v})))}
              </div>
            </div>

          </form>

          {/* FOOTER */}
          {isEditing && (
            <div className="p-4 border-t flex justify-end gap-3">
              <button onClick={() => setIsEditing(false)} className="text-slate-400">Cancel</button>
              <button onClick={handleSubmit} className="px-6 py-2 bg-slate-600 text-white rounded-xl">
                {isLoading ? "Saving..." : "Save Changes"}
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