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
    isTechnician: false,
    hourlyWage: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get("/auth/me");
        setCurrentUser(res.data.user);
      } catch {}
    };
    if (isOpen) fetchMe();
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) setIsOpen(false);
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
          className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-fadeIn"
        >
          {/* Close */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-3xl text-slate-400 hover:text-red-500"
          >
            &times;
          </button>

          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 text-center">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">
              Create New User
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">

            {/* Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required />
              <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" required />
            </div>

            {/* Password + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="********" required />
              <Input label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+1 234 567 890" required />
            </div>

            {/* Role + Designation + Technician */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ModernSelect label="Role" name="role" value={formData.role} onChange={handleChange} options={filteredRoles} />

              <Input label="Designation" name="designation" value={formData.designation} onChange={handleChange} placeholder="Senior Developer" />

              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">Technician</label>
                <div
                  onClick={() => setFormData((p) => ({ ...p, isTechnician: !p.isTechnician }))}
                  className={`flex items-center gap-3 px-4 py-3 border rounded-xl cursor-pointer ${
                    formData.isTechnician ? "bg-blue-50 border-blue-200" : "border-slate-200"
                  }`}
                >
                  <div className={`w-5 h-5 border rounded flex items-center justify-center ${
                    formData.isTechnician ? "bg-blue-500 border-blue-500" : "border-slate-300"
                  }`}>
                    {formData.isTechnician && <FaCheck className="text-white w-3 h-3" />}
                  </div>
                  <span className="text-sm text-slate-600">Assign as Technician</span>
                </div>
              </div>
            </div>

            {/* Department + ReportsTo + Wage */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex gap-2 items-end">
                <ModernSelect
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  options={allDepartments.map((d) => ({ value: d._id, label: d.name }))}
                />
                <button type="button" onClick={() => setIsDeptModalOpen(true)} className="h-[46px] px-4 bg-blue-50 rounded-xl text-blue-600">
                  <FaPlus />
                </button>
              </div>

              <ModernSelect
                label="Reports To"
                name="reportsTo"
                value={formData.reportsTo}
                onChange={handleChange}
                options={allManagers.map((m) => ({ value: m._id, label: m.name }))}
              />

              <Input label="Hourly Wage" name="hourlyWage" type="number" value={formData.hourlyWage} onChange={handleChange} placeholder="25.50" />
            </div>

            {/* Type + Joining Date + Branch + Timezone */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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

              <ModernDatePicker label="Joining Date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} />

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
          </form>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-slate-100 flex gap-3">
            <button onClick={() => setIsOpen(false)} className="flex-1 py-3 font-black text-slate-400 uppercase">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 py-3 bg-[#64748b] text-white rounded-2xl font-black uppercase"
            >
              {isLoading ? "Creating..." : "Create User"}
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
const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
      {label}
    </label>
    <input
      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
      {...props}
    />
  </div>
);