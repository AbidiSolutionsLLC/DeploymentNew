import React, { useState, useRef, useEffect } from "react";
import api from "../axios";
import { toast } from "react-toastify";
import CreateDepartmentModal from "./CreateDepartmentModal";
import { FaPlus, FaCheck } from "react-icons/fa";
import ModernSelect from "./ui/ModernSelect";
import ModernDatePicker from "./ui/ModernDatePicker";
import { validateText, validateEmail, validatePassword, validatePhone, sanitizeText } from "../utils/validationUtils";

const CreateUserModal = ({ isOpen, setIsOpen, onUserCreated, allDepartments, allManagers }) => {
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const modalRef = useRef(null);

  const initialFormState = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    designation: "",
    department: "",
    reportsTo: "",
    role: "Employee",
    empType: "Permanent",
    endDate: "",
    joiningDate: "",
    phoneNumber: "",
    branch: "Karachi",
    timeZone: "Asia/Karachi",
    isTechnician: false,
    hourlyWage: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get("/auth/me");
        setCurrentUser(res.data.user);
      } catch {}
    };
    if (isOpen) fetchMe();
  }, [isOpen]);

  const validateField = (name, value) => {
    let error = null;
    switch (name) {
      case "firstName":
      case "lastName":
        error = validateText(value);
        if (!error && value.length < 2) error = "Must be at least 2 characters.";
        if (!error && !/^[a-zA-Z\s'-]+$/.test(value)) error = "Only letters allowed.";
        break;
      case "email":
        error = validateEmail(value);
        break;
      case "password":
        error = validatePassword(value);
        break;
      case "phoneNumber":
        error = validatePhone(value, true);
        break;
      case "department":
        error = value ? null : "Department is required.";
        break;
      case "reportsTo":
        error = value ? null : "Reporting manager is required.";
        break;
      default:
        break;
    }
    setErrors(p => ({ ...p, [name]: error }));
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => {
      const updated = { ...p, [name]: value };
      if (name === 'empType' && value !== 'Contractor' && value !== 'Intern') {
        updated.endDate = "";
      }
      return updated;
    });
    // Validate on change for better UX
    validateField(name, value);
  };

  const handleBackdropClick = (e) => {
    // If clicking inside the date picker portal, don't close the modal
    if (e.target.closest('#portal-root') || e.target.closest('.react-datepicker')) return;
    if (modalRef.current && !modalRef.current.contains(e.target)) setIsOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const fNameError = validateField("firstName", formData.firstName);
    const lNameError = validateField("lastName", formData.lastName);
    const emailError = validateField("email", formData.email);
    const passError = validateField("password", formData.password);
    const phoneError = validateField("phoneNumber", formData.phoneNumber);

    const deptError = validateField("department", formData.department);
    const reportsToError = validateField("reportsTo", formData.reportsTo);

    if (fNameError || lNameError || emailError || passError || phoneError || deptError || reportsToError) {
      toast.error("Please fix errors before submitting.");
      return;
    }

    setIsLoading(true);
    try {
      const submissionData = {
        ...formData,
        name: sanitizeText(`${formData.firstName} ${formData.lastName}`),
        email: formData.email.toLowerCase()
      };
      // Remove local fields not in model
      delete submissionData.firstName;
      delete submissionData.lastName;

      await api.post("/users", submissionData);
      onUserCreated();
      setIsOpen(false);
      setFormData(initialFormState);
      setErrors({});
      toast.success("User created successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  const baseRoles = [
    { value: "Employee", label: "EMPLOYEE" },
    { value: "Technician", label: "TECHNICIAN" },
    { value: "Manager", label: "MANAGER" },
    { value: "HR", label: "HR" },
    { value: "Admin", label: "ADMIN" },
    { value: "Super Admin", label: "SUPER ADMIN" },
  ];

  const filteredRoles =
    currentUser?.role === "Admin"
      ? baseRoles.filter((r) => r.value !== "Super Admin")
      : baseRoles;

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex justify-center items-center p-4"
        onClick={handleBackdropClick}
      >
        <div
          ref={modalRef}
          className="modal-container-standard"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 text-center bg-white sticky top-0 z-10">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">
              Create New User
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light"
            >
              &times;
            </button>
          </div>

          {/* Form Body */}
          <div className="modal-body-scroll">
            <form id="createUserForm" onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" error={errors.firstName} required />
                  <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" error={errors.lastName} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" error={errors.email} required />
                  <Input label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+1234567890" error={errors.phoneNumber} required />
                </div>
              </div>

              {/* Security & Access */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Security & Access</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="********" error={errors.password} required />
                  <ModernSelect label="Role" name="role" value={formData.role} onChange={handleChange} options={filteredRoles} error={errors.role} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input label="Designation" name="designation" value={formData.designation} onChange={handleChange} placeholder="Senior Developer" />
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Technician Access</label>
                    <div
                      onClick={() => setFormData((p) => ({ ...p, isTechnician: !p.isTechnician }))}
                      className={`flex items-center gap-3 px-4 py-3 border rounded-xl cursor-pointer transition-all ${
                        formData.isTechnician ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200 hover:border-blue-200"
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
              </div>

              {/* Employment Details */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Employment Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex gap-2 items-end">
                    <ModernSelect
                      label="Department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      options={allDepartments.map((d) => ({ value: d._id, label: d.name }))}
                      error={errors.department}
                      className="flex-1"
                    />
                    <button type="button" onClick={() => setIsDeptModalOpen(true)} className="h-[46px] w-[46px] flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shrink-0">
                      <FaPlus size={12} />
                    </button>
                  </div>
                  <ModernSelect
                    label="Reports To"
                    name="reportsTo"
                    value={formData.reportsTo}
                    onChange={handleChange}
                    options={allManagers.map((m) => ({ value: m._id, label: m.name }))}
                    error={errors.reportsTo}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input label="Hourly Wage" name="hourlyWage" type="number" value={formData.hourlyWage} onChange={handleChange} placeholder="25.50" />
                  <ModernSelect
                    label="Employee Type"
                    name="empType"
                    value={formData.empType}
                    onChange={handleChange}
                    options={[
                      { value: "Permanent", label: "Permanent" },
                      { value: "Contractor", label: "Contractor" },
                      { value: "Intern", label: "Intern" },
                      { value: "Part Time", label: "Part Time" },
                    ]}
                  />
                </div>
              </div>

              {/* Dates & Location */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Dates & Location</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <ModernDatePicker label="Joining Date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} />
                  {(formData.empType === "Contractor" || formData.empType === "Intern") && (
                    <ModernDatePicker label="End Date" name="endDate" value={formData.endDate} onChange={handleChange} />
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input label="Branch" name="branch" value={formData.branch} onChange={handleChange} placeholder="New York Office" />
                  <ModernSelect
                    label="Timezone"
                    name="timeZone"
                    value={formData.timeZone}
                    onChange={handleChange}
                    options={[
                      { value: "Asia/Karachi", label: "Asia/Karachi" },
                      { value: "America/New_York", label: "America/New_York" },
                      { value: "Europe/London", label: "Europe/London" },
                    ]}
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-10 py-8 border-t border-slate-100 flex gap-4 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 py-3.5 font-black text-[11px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              form="createUserForm"
              disabled={isLoading}
              className="btn btn-primary flex-1 shadow-lg shadow-blue-100"
            >
              {isLoading ? "CREATING..." : "CREATE USER"}
            </button>
          </div>
        </div>
      </div>

      <CreateDepartmentModal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        onDepartmentCreated={onUserCreated}
        potentialManagers={allManagers}
      />
    </>
  );
};

export default CreateUserModal;

/* Input Component */
const Input = ({ label, error, ...props }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
      {label}
    </label>
    <input
      className={`w-full bg-white border ${error ? 'border-red-400' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300 transition-all`}
      {...props}
    />
    {error && <p className="text-[10px] text-red-500 mt-1 font-bold">{error}</p>}
  </div>
);