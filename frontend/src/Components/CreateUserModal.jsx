import React, { useState, useEffect, useRef } from "react";
import api from "../axios";
import { toast } from "react-toastify";
import CreateDepartmentModal from "./CreateDepartmentModal";
import { FaPlus } from "react-icons/fa";

const CreateUserModal = ({ isOpen, setIsOpen, onUserCreated, allDepartments, allManagers }) => {
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
    timeZone: "Asia/Karachi"
  };

  const [formData, setFormData] = useState(initialFormState);

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
    } catch (error) {
      console.error("Failed to create user:", error);
      toast.error(error.response?.data?.message || "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

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
            {/* ... (Existing Form Inputs - No Changes needed here) ... */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            <div className="py-2 flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="text-[10px] font-black text-slate-300 tracking-tighter uppercase">
                Employment Details
              </span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none appearance-none cursor-pointer"
                >
                  <option value="Employee">EMPLOYEE</option>
                  <option value="Manager">MANAGER</option>
                  <option value="HR">HR</option>
                  <option value="Admin">ADMIN</option>
                  <option value="SuperAdmin">SUPER ADMIN</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                  Designation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300"
                  placeholder="e.g. Software Engineer"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="empType"
                  value={formData.empType}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none appearance-none cursor-pointer"
                >
                  <option value="Permanent">PERMANENT</option>
                  <option value="Contractor">CONTRACTOR</option>
                  <option value="Intern">INTERN</option>
                  <option value="Part Time">PART TIME</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                  Department <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none cursor-pointer"
                    required
                  >
                    <option value="">SELECT DEPARTMENT</option>
                    {allDepartments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsDeptModalOpen(true)}
                    className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                    title="Add Department"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                  Reports To (Manager)
                </label>
                <select
                  name="reportsTo"
                  value={formData.reportsTo}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none cursor-pointer"
                >
                  <option value="">NO MANAGER (TOP LEVEL)</option>
                  {allManagers.map((mgr) => (
                    <option key={mgr._id} value={mgr._id}>
                      {mgr.name.toUpperCase()} ({mgr.designation?.toUpperCase() || "NO TITLE"})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                  Joining Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="joiningDate"
                  value={formData.joiningDate}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                  Branch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none placeholder:text-slate-300"
                  placeholder="Branch"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                  Timezone <span className="text-red-500">*</span>
                </label>
                <select
                  name="timeZone"
                  value={formData.timeZone}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none cursor-pointer"
                >
                  <option value="Asia/Karachi">ASIA/KARACHI</option>
                  <option value="America/New_York">AMERICA/NEW_YORK</option>
                  <option value="Europe/London">EUROPE/LONDON</option>
                  <option value="Asia/Dubai">ASIA/DUBAI</option>
                </select>
              </div>
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
        potentialManagers={allManagers} // NEW: Pass the users list
      />
    </>
  );
};

export default CreateUserModal;