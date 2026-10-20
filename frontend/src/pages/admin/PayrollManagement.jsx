import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { 
  Download, Calendar, Clock, Save, Search, Edit2, Play, X
} from "lucide-react";
import PageContainer from "../../components/ui/PageContainer";
import GlobalTable from "../../components/ui/GlobalTable";
import {
  TablePerson,
  TableMoney,
  TableTitle,
  TableDateRange,
  TableStatus,
} from "../../components/ui/TableCells";
import GlassInput from "../../components/ui/GlassInput";
import FilterRow from "../../components/ui/FilterRow";
import GlassModal from "../../components/ui/GlassModal";
import GlassButton from "../../components/ui/GlassButton";
import DateRangePicker from "../../components/ui/DateRangePicker";
import api from "../../axios";
import { payrollApi } from "../../api/payrollApi";
import { generatePayslipPDF } from "../../utils/generatePayslipPDF";
import { formatDateForAPI } from "../../utils/dateUtils";
import { dispatchReadOnlyModal } from "../../utils/readOnlyEvent";
import { useConfirm } from "../../context/ConfirmContext";

const PayrollManagement = () => {
  const confirm = useConfirm();
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
        formatDateForAPI(startDate), 
        formatDateForAPI(endDate), 
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
    if (currentUserRole === 'globalreader') {
      dispatchReadOnlyModal();
      return;
    }
    if (selectedUsers.size === 0) return toast.warn("Please select at least one employee");
    
    await confirm({ 
      title: "Generate Payslips", 
      message: `Generate payslips for ${selectedUsers.size} employees?`,
      onConfirmAction: async () => {
        setLoading(true);
        try {
          const payslipsToGenerate = previewData.filter(d => selectedUsers.has(d.employee._id));
          const payload = {
            periodStartDate: formatDateForAPI(startDate),
            periodEndDate: formatDateForAPI(endDate),
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
          throw error;
        } finally {
          setLoading(false);
        }
      }
    });
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
    if (currentUserRole === 'globalreader') {
      dispatchReadOnlyModal();
      return;
    }
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
    String(d.employee.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(d.employee.empID || "").toLowerCase().includes(searchTerm.toLowerCase())
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
        <TablePerson
          name={row.employee.name}
          subtitle={row.employee.designation || "N/A"}
          className="min-w-[180px]"
        />
      )
    },
    {
      key: "hours",
      label: "Hours",
      render: (_, row) => (
        <TableTitle
          title={
            row.adjustedHours !== undefined
              ? `${row.adjustedHours} (Adj)`
              : row.totalHoursTracked
          }
          subtitle={row.extraHours > 0 ? `+${row.extraHours} OT` : undefined}
          maxWidth="max-w-[120px]"
        />
      )
    },
    {
      key: "wage",
      label: "Wage Rate",
      render: (_, row) => (
        <TableTitle
          title={
            <TableMoney
              value={row.adjustedWage !== undefined ? row.adjustedWage : row.hourlyWage}
              suffix="/hr"
            />
          }
          subtitle={row.adjustedWage !== undefined ? "Adjusted" : undefined}
          maxWidth="max-w-[140px]"
        />
      )
    },
    {
      key: "total",
      label: "Total Pay",
      render: (_, row) => <TableMoney value={row.totalWages} tone="success" />
    },
    ...(currentUserRole === 'superadmin' || currentUserRole === 'globalreader' ? [{
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
        <TablePerson
          name={row.employee?.name}
          subtitle={row.employee?.empID || "N/A"}
          className="min-w-[180px]"
        />
      )
    },
    {
      key: "period",
      label: "Period",
      render: (_, row) => (
        <TableDateRange start={row.periodStartDate} end={row.periodEndDate} />
      )
    },
    {
      key: "details",
      label: "Details",
      render: (_, row) => (
        <TableTitle
          title={`${
            row.adjustedHours !== null ? row.adjustedHours : row.totalHoursTracked
          } hrs @ $${row.adjustedWage !== null ? row.adjustedWage : row.hourlyWage}/hr`}
          subtitle={row.extraHours > 0 ? `+${row.extraHours} OT` : undefined}
          maxWidth="max-w-[220px]"
        />
      )
    },
    {
      key: "total",
      label: "Total Paid",
      render: (_, row) => <TableMoney value={row.totalWages} tone="success" />
    },
    {
      key: "status",
      label: "Status",
      render: (_, row) => <TableStatus value={row.status} />
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
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => {
                setStartDate(update[0]);
                setEndDate(update[1]);
              }}
            />
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
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="btn btn-secondary h-[42px] px-3 flex items-center gap-1 text-xs"
              >
                <X size={14} /> Clear
              </button>
            )}
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
          <GlobalTable
            columns={previewColumns}
            data={filteredPreviewData}
            loading={loading}
            emptyMessage="No timesheet records found for this period."
          />
        ) : (
          <GlobalTable
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
            <>
              <GlassButton variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" icon={Save} onClick={handleSaveEdit}>
                Apply Override
              </GlassButton>
            </>
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
