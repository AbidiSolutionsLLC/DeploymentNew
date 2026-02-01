import React, { useState, useRef, useEffect } from "react";
import api from "../axios";
import { toast } from "react-toastify";
import CreateDepartmentModal from "./CreateDepartmentModal";
import { FaPlus, FaCheck } from "react-icons/fa";
import ModernSelect from "./ui/ModernSelect"; 
import ModernDatePicker from "./ui/ModernDatePicker";

const CreateUserModal = ({ isOpen, setIsOpen, onUserCreated, allDepartments, allManagers }) => {
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const modalRef = useRef(null);

  const initialFormState = {
    name: "",
    email: "",
    password: "",
    designation: "",
    department: "",
    reportsTo: "",
    role: "Employee",
    empType: "Permanent",
    joiningDate: "",
    phoneNumber: "",
    branch: "Karachi",
    timeZone: "Asia/Karachi",
    isTechnician: false
  };

  const [formData, setFormData] = useState(initialFormState);

  // Fetch current user to determine which roles they can assign
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get("/auth/me");
        setCurrentUser(res.data.user);
      } catch (err) {
        console.error("Failed to fetch current user info", err);
      }
    };
    if (isOpen) fetchMe();
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post("/users", formData);
      onUserCreated();
      setIsOpen(false);
      setFormData(initialFormState);
      toast.success("User created successfully");
    } catch (error) {
      console.error("Failed to create user:", error);
      toast.error(error.response?.data?.message || "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  // Define available roles based on matrix
  const baseRoles = [
    { value: "Employee", label: "EMPLOYEE" },
    { value: "Technician", label: "TECHNICIAN" },
    { value: "Manager", label: "MANAGER" },
    { value: "HR", label: "HR" },
    { value: "Admin", label: "ADMIN" },
    { value: "Super Admin", label: "SUPER ADMIN" },
  ];

  // Logic: Admins cannot create Super Admins
  const filteredRoles = currentUser?.role === "Admin" 
    ? baseRoles.filter(role => role.value !== "Super Admin")
    : baseRoles;

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex justify-center items-center p-4 sm:p-6"
        onClick={handleBackdropClick}
      >
        <div
          ref={modalRef}
          className="w-full max-w-3xl bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[95vh] animate-fadeIn overflow-hidden"
        >
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light z-10"
          >
            &times;
          </button>

          <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 text-center flex-shrink-0">
            <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-widest uppercase">
              CREATE NEW USER
            </h2>
          </div>

          <form
            id="createUserForm"
            onSubmit={handleSubmit}
            className="p-6 sm:p-10 space-y-6 overflow-y-auto custom-scrollbar"
          >
            {/* ROW 1: Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300"
                  placeholder="Full Name"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300"
                  placeholder="Email Address"
                  required
                />
              </div>
            </div>

            {/* ROW 2: Password & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300"
                  placeholder="Min 6 characters"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300"
                  placeholder="Phone Number"
                  required
                />
              </div>
            </div>

            {/* Divider */}
            <div className="py-2 flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="text-[10px] font-black text-slate-300 tracking-tighter uppercase">
                Employment Details
              </span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>

            {/* ROW 3: Role, Designation, Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ModernSelect
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                options={filteredRoles}
              />

              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                  Designation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300 transition-all shadow-sm"
                  placeholder="e.g. Software Engineer"
                  required
                />
              </div>

              {/* TECHNICIAN TOGGLE */}
              <div>
                <label className="block text-[10px] font-black text-transparent mb-2 uppercase tracking-widest select-none">
                  Spacer
                </label>
                <div 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all w-full select-none h-[46px]
                  ${formData.isTechnician ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                  onClick={() => setFormData(prev => ({ ...prev, isTechnician: !prev.isTechnician }))}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData.isTechnician ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                    {formData.isTechnician && <FaCheck className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm font-medium ${formData.isTechnician ? 'text-blue-700' : 'text-slate-500'}`}>
                    Assign as Technician?
                  </span>
                </div>
              </div>
            </div>

            {/* ROW 4: Department & Manager */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex gap-2 items-end">
                <ModernSelect
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  placeholder="SELECT DEPARTMENT"
                  options={allDepartments.map((dept) => ({
                    value: dept._id,
                    label: dept.name.toUpperCase(),
                  }))}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(true)}
                  className="px-4 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors mb-[1px] shadow-sm h-[46px] flex items-center justify-center"
                  title="Add Department"
                >
                  <FaPlus />
                </button>
              </div>

              <ModernSelect
                label="Reports To (Manager)"
                name="reportsTo"
                value={formData.reportsTo}
                onChange={handleChange}
                placeholder="NO MANAGER (TOP LEVEL)"
                options={allManagers.map((mgr) => ({
                  value: mgr._id,
                  label: `${mgr.name.toUpperCase()} (${mgr.designation?.toUpperCase() || "NO TITLE"})`,
                }))}
              />
            </div>

            {/* ROW 5: Type, Joining, Branch, Timezone */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <ModernSelect
                label="Type"
                name="empType"
                value={formData.empType}
                onChange={handleChange}
                required
                options={[
                  { value: "Permanent", label: "PERMANENT" },
                  { value: "Contractor", label: "CONTRACTOR" },
                  { value: "Intern", label: "INTERN" },
                  { value: "Part Time", label: "PART TIME" },
                ]}
              />

              <ModernDatePicker
                label="Joining Date"
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleChange}
                required
                placeholder="Select Date"
              />

              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                  Branch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300 shadow-sm"
                  placeholder="Branch"
                  required
                />
              </div>

              <ModernSelect
                label="Timezone"
                name="timeZone"
                value={formData.timeZone}
                onChange={handleChange}
                required
                options={[
                  { value: "Asia/Karachi", label: "ASIA/KARACHI" },
                  { value: "America/New_York", label: "AMERICA/NEW_YORK" },
                  { value: "Europe/London", label: "EUROPE/LONDON" },
                  { value: "Asia/Dubai", label: "ASIA/DUBAI" },
                ]}
              />
            </div>
          </form>

          <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex gap-3 sm:gap-4 bg-white flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              className="flex-1 py-3 sm:py-4 font-black text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              form="createUserForm"
              disabled={isLoading}
              className="flex-1 py-3 sm:py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
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