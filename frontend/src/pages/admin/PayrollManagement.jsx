import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { 
  Download, Calendar, CheckCircle, Clock, Save, Search, Edit2, Play
} from "lucide-react";
import PageContainer from "../../components/ui/PageContainer";
import TableWithPagination from "../../components/TableWithPagination";
import GlassInput from "../../components/ui/GlassInput";
import FilterRow from "../../components/ui/FilterRow";
import GlassModal from "../../components/ui/GlassModal";
import api from "../../axios";
import { payrollApi } from "../../api/payrollApi";
import { generatePayslipPDF } from "../../utils/generatePayslipPDF";

const PayrollManagement = () => {
  const [activeTab, setActiveTab] = useState("preview"); // 'preview' or 'history'
  const [loading, setLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState("");

  // Preview State
  const [previewData, setPreviewData] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [standardHours, setStandardHours] = useState(40);
  const [searchTerm, setSearchTerm] = useState("");

  // History State
  const [historyData, setHistoryData] = useState([]);

  // Edit Modal State (Super Admin Only)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editFormData, setEditFormData] = useState({ adjustedHours: "", adjustedWage: "" });

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await api.get("/auth/me");
        setCurrentUserRole(res.data.user.role?.replace(/\s+/g, '').toLowerCase() || "");
      } catch (error) {
        console.error("Failed to fetch user role");
      }
    };
    fetchUserRole();
  }, []);

  const fetchPreview = async () => {
    if (!startDate || !endDate) return toast.error("Please select a date range");
    setLoading(true);
    try {
      const data = await payrollApi.previewPayroll(
        startDate.toISOString(), 
        endDate.toISOString(), 
        standardHours
      );
      setPreviewData(data);
      // Auto-select all by default
      setSelectedUsers(new Set(data.map(d => d.employee._id)));
    } catch (error) {
      toast.error(error.message || "Failed to preview payroll");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await payrollApi.getPayslipHistory();
      setHistoryData(data);
    } catch (error) {
      toast.error(error.message || "Failed to fetch payslip history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "preview") {
      fetchPreview();
    } else {
      fetchHistory();
    }
  }, [activeTab, startDate, endDate, standardHours]);

  const handleGenerate = async () => {
    if (selectedUsers.size === 0) return toast.warn("Please select at least one employee");
    if (!window.confirm(`Generate payslips for ${selectedUsers.size} employees?`)) return;

    setLoading(true);
    try {
      const payslipsToGenerate = previewData.filter(d => selectedUsers.has(d.employee._id));
      const payload = {
        periodStartDate: startDate.toISOString(),
        periodEndDate: endDate.toISOString(),
        standardHours,
        payslips: payslipsToGenerate.map(p => ({
          employeeId: p.employee._id,
          totalHoursTracked: p.totalHoursTracked,
          adjustedHours: p.adjustedHours,
          extraHours: p.extraHours,
          hourlyWage: p.hourlyWage,
          adjustedWage: p.adjustedWage,
          totalWages: p.totalWages
        }))
      };

      await payrollApi.generatePayslips(payload);
      toast.success("Payslips generated successfully!");
      setActiveTab("history"); // Switch to history tab to see them
    } catch (error) {
      toast.error(error.message || "Failed to generate payslips");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (row) => {
    setEditingRow(row);
    setEditFormData({
      adjustedHours: row.adjustedHours !== undefined ? row.adjustedHours : row.totalHoursTracked,
      adjustedWage: row.adjustedWage !== undefined ? row.adjustedWage : row.hourlyWage,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    const newHours = parseFloat(editFormData.adjustedHours);
    const newWage = parseFloat(editFormData.adjustedWage);
    
    if (isNaN(newHours) || isNaN(newWage)) return toast.error("Invalid numbers");

    setPreviewData(prev => prev.map(p => {
      if (p.employee._id === editingRow.employee._id) {
        const extraHours = Math.max(0, newHours - standardHours);
        const totalWages = newHours * newWage;
        return {
          ...p,
          adjustedHours: newHours,
          adjustedWage: newWage,
          extraHours,
          totalWages
        };
      }
      return p;
    }));
    
    setIsEditModalOpen(false);
    toast.success("Adjustments saved for preview. Don't forget to generate.");
  };

  const toggleUserSelection = (userId) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) newSelection.delete(userId);
    else newSelection.add(userId);
    setSelectedUsers(newSelection);
  };

  const handleDownloadCSV = () => {
    const dataToExport = activeTab === "preview" 
      ? previewData.filter(d => selectedUsers.has(d.employee._id)) 
      : historyData;
      
    if (dataToExport.length === 0) return toast.warn("No data to download (make sure rows are selected)");

    let headers, rows;

    if (activeTab === "preview") {
      headers = ["Employee", "Tracked Hours", "Adjusted Hours", "Hourly Wage", "Adjusted Wage", "Extra Hours", "Total Wage"];
      rows = dataToExport.map(d => [
        `"${d.employee.name}"`,
        d.totalHoursTracked,
        d.adjustedHours !== undefined ? d.adjustedHours : "--",
        d.hourlyWage,
        d.adjustedWage !== undefined ? d.adjustedWage : "--",
        d.extraHours,
        d.totalWages
      ]);
    } else {
      headers = ["Employee", "Period Start", "Period End", "Final Hours", "Final Wage", "Extra Hours", "Total Paid", "Status"];
      rows = dataToExport.map(d => [
        `"${d.employee?.name || 'Unknown'}"`,
        new Date(d.periodStartDate).toLocaleDateString(),
        new Date(d.periodEndDate).toLocaleDateString(),
        d.adjustedHours !== null ? d.adjustedHours : d.totalHoursTracked,
        d.adjustedWage !== null ? d.adjustedWage : d.hourlyWage,
        d.extraHours,
        d.totalWages,
        d.status
      ]);
    }

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `payroll_${activeTab}_report.csv`;
    link.click();
  };

  // Prepare filtered data for preview table
  const filteredPreviewData = previewData.filter(d => 
    d.employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.employee.empID?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const previewColumns = [
    {
      key: "select",
      label: (
        <input 
          type="checkbox" 
          checked={selectedUsers.size === previewData.length && previewData.length > 0}
          onChange={(e) => {
            if (e.target.checked) setSelectedUsers(new Set(previewData.map(d => d.employee._id)));
            else setSelectedUsers(new Set());
          }}
          className="rounded border-border-subtle text-brand-primary focus:ring-brand-primary"
        />
      ),
      render: (_, row) => (
        <input 
          type="checkbox" 
          checked={selectedUsers.has(row.employee._id)}
          onChange={() => toggleUserSelection(row.employee._id)}
          className="rounded border-border-subtle text-brand-primary focus:ring-brand-primary"
        />
      )
    },
    {
      key: "employee",
      label: "Employee",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "var(--color-bg-active)", color: "var(--color-brand-text)" }}>
            {row.employee.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-main">{row.employee.name}</p>
            <p className="text-[10px] font-bold text-muted uppercase">{row.employee.designation || "N/A"}</p>
          </div>
        </div>
      )
    },
    {
      key: "hours",
      label: "Hours",
      render: (_, row) => (
        <div>
          <p className="text-sm font-bold text-main">
            {row.adjustedHours !== undefined ? (
              <span className="text-amber-500 flex items-center gap-1">{row.adjustedHours} <span className="text-[10px] bg-amber-100 text-amber-700 px-1 rounded">Adj</span></span>
            ) : row.totalHoursTracked}
          </p>
          {row.extraHours > 0 && <p className="text-[10px] font-bold text-rose-500 uppercase">+{row.extraHours} OT</p>}
        </div>
      )
    },
    {
      key: "wage",
      label: "Wage Rate",
      render: (_, row) => (
        <p className="text-sm font-bold text-main">
          {row.adjustedWage !== undefined ? (
            <span className="text-amber-500 flex items-center gap-1">${row.adjustedWage}/hr <span className="text-[10px] bg-amber-100 text-amber-700 px-1 rounded">Adj</span></span>
          ) : `$${row.hourlyWage}/hr`}
        </p>
      )
    },
    {
      key: "total",
      label: "Total Pay",
      render: (_, row) => (
        <p className="text-sm font-black text-emerald-600">${row.totalWages?.toFixed(2)}</p>
      )
    },
    ...(currentUserRole === 'superadmin' ? [{
      key: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <button onClick={() => handleEditClick(row)} className="p-2 text-muted hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Edit Override">
          <Edit2 size={16} />
        </button>
      )
    }] : [])
  ];

  const historyColumns = [
    {
      key: "employee",
      label: "Employee",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "var(--color-bg-active)", color: "var(--color-brand-text)" }}>
            {row.employee?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-main">{row.employee?.name}</p>
            <p className="text-[10px] font-bold text-muted uppercase">{row.employee?.empID || "N/A"}</p>
          </div>
        </div>
      )
    },
    {
      key: "period",
      label: "Period",
      render: (_, row) => (
        <p className="text-xs font-medium text-muted">
          {new Date(row.periodStartDate).toLocaleDateString()} - {new Date(row.periodEndDate).toLocaleDateString()}
        </p>
      )
    },
    {
      key: "details",
      label: "Details",
      render: (_, row) => (
        <div>
          <p className="text-xs text-main">{row.adjustedHours !== null ? row.adjustedHours : row.totalHoursTracked} hrs @ ${row.adjustedWage !== null ? row.adjustedWage : row.hourlyWage}/hr</p>
          {row.extraHours > 0 && <p className="text-[10px] font-bold text-rose-500 uppercase">+{row.extraHours} OT</p>}
        </div>
      )
    },
    {
      key: "total",
      label: "Total Paid",
      render: (_, row) => (
        <p className="text-sm font-black text-emerald-600">${row.totalWages?.toFixed(2)}</p>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (_, row) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: "var(--status-info-bg)", color: "var(--status-info-fg)", border: "1px solid var(--status-info-border)" }}>
          <CheckCircle size={12} /> {row.status}
        </span>
      )
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <button 
          onClick={() => generatePayslipPDF(row)} 
          className="p-1.5 text-muted hover:text-brand-primary hover:bg-blue-50 rounded-lg transition-all flex items-center gap-1" 
          title="Download Payslip PDF"
        >
          <Download size={14} /> <span className="text-[10px] font-black uppercase tracking-wider">PDF</span>
        </button>
      )
    }
  ];

  return (
    <PageContainer
      title="Payroll Management"
      subtitle="Calculate wages, preview payslips, and generate payroll records."
      headerActions={
        <div className="flex items-center gap-2">
          {activeTab === "preview" && (
            <button onClick={handleGenerate} className="btn btn-primary flex items-center gap-2" disabled={loading || selectedUsers.size === 0}>
              <Play size={16} /> Generate Selected ({selectedUsers.size})
            </button>
          )}
          <button onClick={handleDownloadCSV} className="btn btn-secondary flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
        </div>
      }
      filters={
        activeTab === "preview" && (
          <FilterRow>
            <GlassInput
              placeholder="Search Employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[160px]"
            />
            <div className="flex items-center bg-surface border border-border-subtle rounded-xl px-3 h-[42px] gap-2">
              <Calendar size={14} className="text-muted flex-shrink-0" />
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                className="w-24 bg-transparent border-none text-xs font-semibold text-main outline-none cursor-pointer !py-0 !px-0"
              />
              <span className="text-muted text-xs">-</span>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                className="w-24 bg-transparent border-none text-xs font-semibold text-main outline-none cursor-pointer !py-0 !px-0"
              />
            </div>
            <div className="flex items-center bg-surface border border-border-subtle rounded-xl px-3 h-[42px] gap-2 min-w-[140px]">
              <Clock size={14} className="text-muted flex-shrink-0" />
              <input 
                type="number" 
                value={standardHours} 
                onChange={(e) => setStandardHours(e.target.value)}
                className="w-16 bg-transparent border-none text-xs font-semibold text-main outline-none"
                placeholder="Std Hrs"
              />
              <span className="text-xs text-muted">Std Hrs</span>
            </div>
          </FilterRow>
        )
      }
      isCard={false}
    >
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("preview")}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
            activeTab === "preview" 
              ? "bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20" 
              : "bg-surface text-muted border-border-subtle hover:border-subtle"
          }`}
        >
          Preview & Generate
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
            activeTab === "history" 
              ? "bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20" 
              : "bg-surface text-muted border-border-subtle hover:border-subtle"
          }`}
        >
          Payslip History
        </button>
      </div>

      <div className="glass-card p-0 overflow-hidden">
        {activeTab === "preview" ? (
          <TableWithPagination
            columns={previewColumns}
            data={filteredPreviewData}
            loading={loading}
            emptyMessage="No timesheet records found for this period."
          />
        ) : (
          <TableWithPagination
            columns={historyColumns}
            data={historyData}
            loading={loading}
            emptyMessage="No previously generated payslips found."
          />
        )}
      </div>

      {isEditModalOpen && (
        <GlassModal
          isOpen={true}
          onClose={() => setIsEditModalOpen(false)}
          maxWidth="max-w-sm"
          title="Super Admin Override"
          footer={
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-2 text-xs font-bold text-muted hover:text-main uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="btn btn-primary flex-1 flex justify-center items-center gap-2"
              >
                <Save size={14} /> Apply Override
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs font-medium mb-4">
              <strong>Warning:</strong> You are overriding the system-calculated values. This adjustment is only for this specific payslip generation.
            </div>
            <div>
              <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Adjusted Total Hours</label>
              <GlassInput
                type="number"
                value={editFormData.adjustedHours}
                onChange={(e) => setEditFormData({ ...editFormData, adjustedHours: e.target.value })}
                placeholder="e.g. 40"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Adjusted Hourly Wage ($)</label>
              <GlassInput
                type="number"
                value={editFormData.adjustedWage}
                onChange={(e) => setEditFormData({ ...editFormData, adjustedWage: e.target.value })}
                placeholder="e.g. 25.50"
              />
            </div>
          </div>
        </GlassModal>
      )}
    </PageContainer>
  );
};

export default PayrollManagement;
