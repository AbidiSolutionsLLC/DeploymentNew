import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";

import ModernSelect from "../../components/ui/ModernSelect";
import PageContainer from "../../components/ui/PageContainer";
import PortalHero from "../../components/ui/PortalHero";
import PortalTabBar from "../../components/ui/PortalTabBar";
import GlassInput from "../../components/ui/GlassInput";
import GlassButton from "../../components/ui/GlassButton";
import GlassModal from "../../components/ui/GlassModal";
import Loader from "../../components/ui/Loader";
import FilterRow from "../../components/ui/FilterRow";
import FilterPanel from "../../components/ui/FilterPanel";
import StatCard from "../../components/ui/StatCard";
import GlobalTable from "../../components/ui/GlobalTable";
import {
  TableBoolean,
  TablePill,
  TableStatus,
  TableText,
  TableTitle,
} from "../../components/ui/TableCells";
import Toast from "../../components/Toast";
import { FaBuilding, FaUsers, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaFileCsv, FaSyncAlt, FaPlus, FaSearch, FaTimes, FaShieldAlt } from "react-icons/fa";
import { Squares2X2Icon } from "@heroicons/react/20/solid";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import api from "../../axios";
import { useConfirm } from "../../context/ConfirmContext";
import { downloadCsv } from "../../utils/tableUtils";

const EASE = [0.16, 1, 0.3, 1];

function TenantManagement() {
  const confirm = useConfirm();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [searchTerm, setFaSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(false);

  const [showToast, setShowToast] = useState(null);

  const initialFormState = {
    companyName: "",
    companyOwner: "",
    contactNo: "",
    companyEmail: "",
    website: "",
    address: "",
    noOfEmployees: "",
    companyType: "Tech",
    customCompanyType: "",
    adminPassword: "",
    maxUsers: 50,
    timezone: "America/New_York",
    currency: "USD",
    azureTenantId: "",
    azureClientId: "",
    emailProvider: "Default",
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPass: "",
    fromEmail: "",
    subscriptionStatus: "Active"
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await api.get("/master/companies");
      setCompanies(res.data || []);
    } catch (err) {
      console.error("Failed to load companies:", err);
      if (err.response?.status === 403) {
        setShowToast({
          message: "Access Denied: Master Tenant Only",
          type: "error"
        });
      } else {
        setShowToast({
          message: "Failed to load companies",
          type: "error"
        });
      }
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const finalCompanyType = formData.companyType === "Other" && formData.customCompanyType
        ? formData.customCompanyType
        : formData.companyType;

      const payload = {
        companyName: formData.companyName,
        companyOwner: formData.companyOwner,
        contactNo: formData.contactNo,
        companyEmail: formData.companyEmail,
        website: formData.website,
        address: formData.address,
        noOfEmployees: formData.noOfEmployees,
        companyType: finalCompanyType,
        ...formData,
        emailConfig: {
          provider: formData.emailProvider,
          smtpHost: formData.smtpHost,
          smtpPort: formData.smtpPort,
          smtpUser: formData.smtpUser,
          smtpPass: formData.smtpPass,
          fromEmail: formData.fromEmail
        }
      };
      await api.post("/master/onboard", payload);
      setShowToast({ message: "Company onboarded successfully", type: "success" });
      setIsModalOpen(false);
      setFormData(initialFormState);
      fetchCompanies();
    } catch (error) {
      setShowToast({
        message: error.response?.data?.message || "Failed to onboard company",
        type: "error"
      });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        companyName: formData.companyName,
        companyOwner: formData.companyOwner,
        contactNo: formData.contactNo,
        companyEmail: formData.companyEmail,
        website: formData.website,
        address: formData.address,
        noOfEmployees: formData.maxUsers,
        subscriptionStatus: formData.subscriptionStatus,
        azureTenantId: formData.azureTenantId,
        azureClientId: formData.azureClientId,
        emailConfig: {
          provider: formData.emailProvider,
          smtpHost: formData.smtpHost,
          smtpPort: formData.smtpPort,
          smtpUser: formData.smtpUser,
          smtpPass: formData.smtpPass,
          fromEmail: formData.fromEmail
        }
      };
      await api.put(`/master/companies/${selectedTenant._id}`, payload);
      setShowToast({ message: "Company configuration updated", type: "success" });
      setIsEditModalOpen(false);
      fetchCompanies();
    } catch (error) {
      setShowToast({
        message: error.response?.data?.message || "Failed to update company",
        type: "error"
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/master/companies/${id}`);
      setShowToast({ message: "Company deleted successfully", type: "success" });
      fetchCompanies();
    } catch (error) {
      setShowToast({
        message: error.response?.data?.message || "Failed to delete company",
        type: "error"
      });
    }
  };

  const openEditModal = (tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      ...initialFormState,
      companyName: tenant.companyName || "",
      companyOwner: tenant.companyOwner || "",
      contactNo: tenant.contactNo || "",
      companyEmail: tenant.companyEmail || "",
      website: tenant.website || "",
      address: tenant.address || "",
      noOfEmployees: tenant.noOfEmployees || "",
      maxUsers: tenant.maxUsers || 50,
      subscriptionStatus: tenant.subscriptionStatus || "Active",
      azureTenantId: tenant.azureTenantId || "",
      azureClientId: tenant.azureClientId || "",
      emailProvider: tenant.emailConfig?.provider || "Default",
      smtpHost: tenant.emailConfig?.smtpHost || "",
      smtpPort: tenant.emailConfig?.smtpPort || "",
      smtpUser: tenant.emailConfig?.smtpUser || "",
      smtpPass: tenant.emailConfig?.smtpPass || "",
      fromEmail: tenant.emailConfig?.fromEmail || ""
    });
    setIsEditModalOpen(true);
  };

  // Filter data — search, type AND the active status tab (0=All, 1=Active, 2=Suspended)
  const getFilteredData = () => {
    return companies.filter(c => {
      const searchLower = searchTerm.toLowerCase();
      const matchesFaSearch =
        !searchTerm ||
        (c.companyName?.toLowerCase() || "").includes(searchLower) ||
        (c.companyOwner?.toLowerCase() || "").includes(searchLower) ||
        (c.companyEmail?.toLowerCase() || "").includes(searchLower);
      const matchesType = filterType === "All" || c.companyType === filterType;
      const status = c.subscriptionStatus || "Active";
      const matchesTab =
        activeTab === 0 ||
        (activeTab === 1 && status === "Active") ||
        (activeTab === 2 && status === "Suspended");
      return matchesFaSearch && matchesType && matchesTab;
    });
  };

  const resetFilters = () => {
    setFaSearchTerm("");
    setFilterType("All");
    setActiveTab(0);
  };

  // KPI helpers
  const activeCount = useMemo(() => companies.filter(c => (c.subscriptionStatus || "Active") === "Active").length, [companies]);
  const suspendedCount = useMemo(() => companies.filter(c => (c.subscriptionStatus || "Active") === "Suspended").length, [companies]);

  // CSV export header
  const exportCsv = () => {
    const header = [
      "S.No.",
      "Company Name",
      "Owner",
      "Admin Email",
      "Type",
      "Status",
      "User Limit",
      "Master Tenant"
    ];
    const rows = getFilteredData().map((c, i) => [
      i + 1,
      c.companyName || "-",
      c.companyOwner || "-",
      c.companyEmail || "-",
      c.companyType || "-",
      c.subscriptionStatus || "Active",
      c.maxUsers || 50,
      c.isMasterTenant ? "Yes" : "No"
    ]);
    downloadCsv(`tenants-${new Date().toISOString().slice(0, 10)}.csv`, header, rows);
    setShowToast({ message: "Tenant data exported", type: "success" });
  };

  // ---------- Tabs ----------
  const tabs = [
    { key: 0, title: "All Tenants", icon: FaBuilding, hint: "All isolated tenants", badge: companies.length },
    { key: 1, title: "Active", icon: FaCheckCircle, hint: "Active tenants", badge: activeCount },
    { key: 2, title: "Suspended", icon: FaTimesCircle, hint: "Suspended tenants", badge: suspendedCount }
  ];

  // ---------- Portal Hero ----------

  const heroChips = [
    { icon: FaBuilding, value: companies.length, label: " Tenants" },
    { pulse: true, value: suspendedCount, label: " Suspended" },
    { icon: FaCheckCircle, value: activeCount, label: " Active" },
  ];

  // ---------- Portal TabBar right ----------
  const rightTabActions = (
    <>
      <span className="hidden xl:block text-[10px] font-black uppercase tracking-widest text-muted">
        Tenant Directory
      </span>
      <button
        onClick={() => fetchCompanies()}
        disabled={loading}
        className="btn btn-primary w-full lg:w-auto flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 transition-transform"
        title="Refresh tenant data"
      >
        <FaSyncAlt size={13} className={loading ? "animate-spin" : ""} />
        Refresh
      </button>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn btn-primary ml-2"
        title="Onboard new tenant"
      >
        <FaPlus size={14} strokeWidth={3} /> Onboard Tenant
      </button>
    </>
  );

  // ---------- Table columns (declared before the early return so the hook always runs) ----------
  const columns = useMemo(
    () => [
      {
        key: "__index",
        label: "S.No.",
        sortable: false,
        type: "index",
        className: "text-muted text-xs font-bold",
      },
      {
        key: "companyName",
        label: "Company Name",
        sortable: true,
        render: (_, c) => (
          <TableTitle
            title={c.companyName}
            maxWidth="min-w-[200px]"
            leading={
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm font-bold shrink-0">
                {c.companyName?.charAt(0).toUpperCase() || "C"}
              </div>
            }
          />
        )
      },
      {
        key: "companyOwner",
        label: "Owner",
        sortable: true,
        render: (_, c) => <TableText value={c.companyOwner} />
      },
      {
        key: "companyEmail",
        label: "Admin Email",
        sortable: true,
        render: (_, c) => <TableText value={c.companyEmail} muted />
      },
      {
        key: "companyType",
        label: "Type",
        sortable: true,
        render: (_, c) => <TablePill>{c.companyType}</TablePill>
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (_, c) => <TableStatus value={c?.subscriptionStatus || "Active"} />
      },
      {
        key: "maxUsers",
        label: "User Limit",
        sortable: true,
        render: (_, c) => <TableText value={c.maxUsers || 50} />
      },
      {
        key: "isMasterTenant",
        label: "Master Tenant",
        sortable: true,
        render: (_, c) => (
          <TableBoolean value={c.isMasterTenant} icon={<FaShieldAlt size={12} />} />
        )
      },
      {
        key: "actions",
        label: "Actions",
        align: "right",
        render: (_, c) => (
          <div className="flex justify-end items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <EyeIcon
              className="w-4 h-4 cursor-pointer text-muted hover:text-brand-text transition-colors"
              onClick={() => {
                setSelectedTenant(c);
                setIsViewModalOpen(true);
              }}
            />
            <PencilIcon
              className="w-4 h-4 cursor-pointer text-muted hover:text-brand-text transition-colors"
              onClick={() => openEditModal(c)}
            />
            <TrashIcon
              onClick={() => {
                if (c.isMasterTenant) {
                  setShowToast({
                    message: "Master Tenant cannot be deleted.",
                    type: "error"
                  });
                  return;
                }
                confirm({
                  title: "Delete Tenant?",
                  message: `Are you sure you want to completely remove ${c.companyName}? This action is irreversible and deletes all associated user accounts.`,
                  confirmText: "Delete",
                  cancelText: "Cancel",
                  onConfirmAction: () => handleDelete(c._id)
                });
              }}
              className={`w-4 h-4 transition-colors ${c.isMasterTenant ? "text-slate-300 dark:text-slate-600 cursor-not-allowed" : "cursor-pointer text-muted hover:text-danger"}`}
            />
          </div>
        )
      }
    ],
    []
  );

  // ---------- Error render ----------
  if (error && companies.length === 0) {
    return (
      <div className="glass-card text-center py-14">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-danger-bg border border-danger-border flex items-center justify-center">
          <FaExclamationTriangle size={22} className="text-danger" />
        </div>
        <p className="text-sm font-bold text-heading">Failed to load tenants</p>
        <p className="text-xs text-muted mt-1 mb-5">
          We couldn't load the tenant directory. Please try again.
        </p>
        <GlassButton variant="primary" onClick={fetchCompanies}>
          RETRY
        </GlassButton>
      </div>
    );
  }

  // ---------- Render ----------
  return (
    <>
      {/* Page-level Toast */}
      {showToast && (
        <Toast
          message={showToast.message}
          type={showToast.type}
          onClose={() => setShowToast(null)}
        />
      )}

      <PageContainer isCard={false}>
        <div className="flex flex-col gap-4 w-full">

          {/* ==================== HERO ==================== */}
          <PortalHero
                label="Tenant administration"
              title="Tenant Management"
            description="Onboard isolated workspaces, tune licensing and SSO, and keep every tenant healthy."
            chips={heroChips}
          />

          {/* ==================== TAB BAR ==================== */}
          <PortalTabBar
            tabs={tabs.map((t) => (t.key === 0 ? { ...t, badge: companies.length } : t))}
            activeKey={activeTab}
            onChange={setActiveTab}
            idPrefix="tenant-tab"
            panelId="tenant-tabpanel"
            ariaLabel="Tenant sections"
            layoutId="tk-tab-pill"
            right={rightTabActions}
          />

          {/* Tab content — remount on change */}
          <Motion.div
            key={activeTab}
            id="tenant-tabpanel"
            role="tabpanel"
            aria-labelledby={`tenant-tab-${activeTab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.14, ease: EASE }}
            className="space-y-4"
          >
            {/* ==================== KPI CARDS ==================== */}
            <div className="lm-stagger grid grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                title="Total Tenants"
                value={companies.length}
                sub="Tenants in current view"
                icon={FaBuilding}
                tone="text-main"
                iconBg="bg-app"
              />
              <StatCard
                title="Active"
                value={activeCount}
                sub="Subscription healthy"
                icon={FaCheckCircle}
                tone="text-emerald-600 dark:text-emerald-400"
                iconBg="bg-emerald-100 dark:bg-emerald-900/40"
              />
              <StatCard
                title="Suspended"
                value={suspendedCount}
                sub="Needs attention"
                icon={FaTimesCircle}
                tone="text-rose-600 dark:text-rose-400"
                iconBg="bg-rose-100 dark:bg-rose-900/40"
              />
              <StatCard
                title="Licensed Seats"
                value={companies.reduce((sum, c) => sum + (c.maxUsers || 0), 0)}
                sub="Total user capacity"
                icon={FaUsers}
                tone="text-sky-600 dark:text-sky-400"
                iconBg="bg-sky-100 dark:bg-sky-900/40"
              />
            </div>

            {/* ==================== FILTERS ==================== */}
            <FilterPanel
              title="Tenant Directory"
              subtitle={`${getFilteredData().length} of ${companies.length} tenants · updated just now`}
              hint="Click a tenant row to view its full configuration. Master tenant cannot be deleted."
              actions={
                <>
                  {(searchTerm || filterType !== "All" || activeTab !== 0) && (
                    <GlassButton variant="ghost" size="sm" onClick={resetFilters}>
                      RESET
                    </GlassButton>
                  )}
                  <GlassButton variant="secondary" size="sm" icon={FaFileCsv} onClick={exportCsv}>
                    EXPORT CSV
                  </GlassButton>
                </>
              }
            >
              <FilterRow>
                <GlassInput
                  placeholder="FaSearch tenants..."
                  value={searchTerm}
                  onChange={(e) => setFaSearchTerm(e.target.value)}
                  className="flex-1 min-w-[220px]"
                />
                <div className="min-w-[160px]">
                  <ModernSelect
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    options={[
                      { value: "All", label: "All Types" },
                      { value: "Tech", label: "Tech" },
                      { value: "Marketing", label: "Marketing" },
                      { value: "E-Commerce", label: "E-Commerce" },
                      { value: "Other", label: "Other" }
                    ]}
                    placeholder="Company Type"
                  />
                </div>
              </FilterRow>
            </FilterPanel>

            {/* ==================== TABLE ==================== */}
            <GlobalTable
              columns={columns}
              data={getFilteredData()}
              loading={loading}
              emptyMessage={searchTerm || filterType !== "All" || activeTab !== 0
                ? "No tenants match these filters"
                : "No tenants found."
              }
              onEmptyAction={resetFilters}
              emptyActionLabel="Clear all filters"
              actions={[]}
              
              defaultSort={{ key: "companyName", direction: "asc" }}
              countLabel="tenants"
            />
          </Motion.div>
        </div>
      </PageContainer>

      {/* --- CREATE MODAL --- */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Onboard New Tenant"
        description="Enter the details to create an isolated workspace."
        maxWidth="max-w-2xl"
        footer={
          <>
            <GlassButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</GlassButton>
            <GlassButton type="submit" form="onboard-form" variant="primary">Onboard Tenant</GlassButton>
          </>
        }
      >
        <form id="onboard-form" onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="bg-surface border border-border-subtle p-5 rounded-2xl relative shadow-sm group">
            <h4 className="absolute -top-3 left-4 bg-surface px-2 text-[10px] font-black tracking-widest uppercase text-brand-primary">Basic Info</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <input name="companyName" placeholder="Company Name" required onChange={handleInputChange} className="glass-input" />
              <input name="companyOwner" placeholder="Owner Name" required onChange={handleInputChange} className="glass-input" />
              <input name="contactNo" placeholder="Contact No" required onChange={handleInputChange} className="glass-input" />
              <input name="companyEmail" type="email" placeholder="Admin Email" required onChange={handleInputChange} className="glass-input" />
              <input name="website" placeholder="Website" required onChange={handleInputChange} className="glass-input" />
              <input name="address" placeholder="Address" required onChange={handleInputChange} className="glass-input" />
              <input name="noOfEmployees" type="number" placeholder="No. of Employees" required onChange={handleInputChange} className="glass-input" />
              <select name="companyType" onChange={handleInputChange} className="glass-input cursor-pointer">
                <option value="Tech">Tech</option>
                <option value="Marketing">Marketing</option>
                <option value="E-Commerce">E-Commerce</option>
                <option value="Other">Other (Specify)</option>
              </select>
              {formData.companyType === "Other" && (
                <input name="customCompanyType" placeholder="Specify Company Type" required onChange={handleInputChange} className="glass-input sm:col-span-2" />
              )}
              <input name="adminPassword" type="password" placeholder="Initial Admin Password" required onChange={handleInputChange} className="glass-input sm:col-span-2" />
            </div>
          </div>

          <div className="bg-surface border border-border-subtle p-5 rounded-2xl relative shadow-sm group mt-6">
            <h4 className="absolute -top-3 left-4 bg-surface px-2 text-[10px] font-black tracking-widest uppercase text-muted group-focus-within:text-brand-primary transition-colors">Licensing & Preferences</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <input name="maxUsers" type="number" placeholder="Max Allowed Users (e.g. 50)" required onChange={handleInputChange} className="glass-input" />
              <select name="currency" onChange={handleInputChange} className="glass-input cursor-pointer">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AUD">AUD ($)</option>
                <option value="PKR">PKR (Rs)</option>
              </select>
              <select name="timezone" onChange={handleInputChange} className="glass-input sm:col-span-2 cursor-pointer">
                <option value="America/New_York">America/New_York (Eastern US & Canada)</option>
                <option value="UTC">UTC (Default)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
              </select>
            </div>
          </div>

          <div className="bg-surface border border-border-subtle p-5 rounded-2xl relative shadow-sm group mt-6">
            <h4 className="absolute -top-3 left-4 bg-surface px-2 text-[10px] font-black tracking-widest uppercase text-muted group-focus-within:text-brand-primary transition-colors">SSO Config (Optional)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <input name="azureTenantId" placeholder="Azure Tenant ID" onChange={handleInputChange} className="glass-input" />
              <input name="azureClientId" placeholder="Azure Client ID" onChange={handleInputChange} className="glass-input" />
            </div>
          </div>

          <div className="bg-surface border border-border-subtle p-5 rounded-2xl relative shadow-sm group mt-6">
            <h4 className="absolute -top-3 left-4 bg-surface px-2 text-[10px] font-black tracking-widest uppercase text-muted group-focus-within:text-brand-primary transition-colors">Email Service</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <select name="emailProvider" onChange={handleInputChange} className="glass-input cursor-pointer">
                <option value="Default">Use Default (Abidi Solutions Gmail)</option>
                <option value="Custom">Custom SMTP Credentials</option>
              </select>
              {formData.emailProvider === "Custom" && (
                <>
                  <input name="smtpHost" placeholder="SMTP Host" onChange={handleInputChange} className="glass-input" />
                  <input name="smtpPort" placeholder="SMTP Port (e.g. 587)" onChange={handleInputChange} className="glass-input" />
                  <input name="smtpUser" placeholder="SMTP User" onChange={handleInputChange} className="glass-input" />
                  <input name="smtpPass" type="password" placeholder="SMTP Pass" onChange={handleInputChange} className="glass-input" />
                  <input name="fromEmail" placeholder="From Email (e.g. no-reply@company.com)" onChange={handleInputChange} className="glass-input sm:col-span-2" />
                </>
              )}
            </div>
          </div>
        </form>
      </GlassModal>

      {/* --- EDIT MODAL --- */}
      <GlassModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Tenant Configuration"
        description={`Update settings for ${selectedTenant?.companyName}`}
        maxWidth="max-w-2xl"
        footer={
          <>
            <GlassButton type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</GlassButton>
            <GlassButton type="submit" form="edit-form" variant="primary">Save Changes</GlassButton>
          </>
        }
      >
        <form id="edit-form" onSubmit={handleEditSubmit} className="space-y-6 pt-2">
          <div className="bg-surface border border-border-subtle p-5 rounded-2xl relative shadow-sm group">
            <h4 className="absolute -top-3 left-4 bg-surface px-2 text-[10px] font-black tracking-widest uppercase text-brand-primary">Basic Info</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <input name="companyName" value={formData.companyName} placeholder="Company Name" required onChange={handleInputChange} className="glass-input" />
              <input name="companyOwner" value={formData.companyOwner} placeholder="Owner Name" required onChange={handleInputChange} className="glass-input" />
              <input name="contactNo" value={formData.contactNo} placeholder="Contact No" required onChange={handleInputChange} className="glass-input" />
              <input name="companyEmail" value={formData.companyEmail} type="email" placeholder="Admin Email" required onChange={handleInputChange} className="glass-input" />
              <input name="website" value={formData.website} placeholder="Website" required onChange={handleInputChange} className="glass-input" />
              <input name="address" value={formData.address} placeholder="Address" required onChange={handleInputChange} className="glass-input" />
              <input name="noOfEmployees" value={formData.noOfEmployees} type="number" placeholder="No. of Employees" required onChange={handleInputChange} className="glass-input" />
            </div>
          </div>

          <div className="bg-surface border border-border-subtle p-5 rounded-2xl relative shadow-sm group">
            <h4 className="absolute -top-3 left-4 bg-surface px-2 text-[10px] font-black tracking-widest uppercase text-brand-primary">Licensing & Access</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="text-[10px] font-black text-muted uppercase ml-1">User Limit</label>
                <input name="maxUsers" type="number" value={formData.maxUsers} onChange={handleInputChange} className="glass-input" />
              </div>
              <div>
                <label className="text-[10px] font-black text-muted uppercase ml-1">Status</label>
                <select name="subscriptionStatus" value={formData.subscriptionStatus} onChange={handleInputChange} className="glass-input cursor-pointer">
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border-subtle p-5 rounded-2xl relative shadow-sm group mt-6">
            <h4 className="absolute -top-3 left-4 bg-surface px-2 text-[10px] font-black tracking-widest uppercase text-muted group-focus-within:text-brand-primary transition-colors">SSO Config</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="text-[10px] font-black text-muted uppercase ml-1">Azure Tenant ID</label>
                <input name="azureTenantId" value={formData.azureTenantId} onChange={handleInputChange} className="glass-input" />
              </div>
              <div>
                <label className="text-[10px] font-black text-muted uppercase ml-1">Azure Client ID</label>
                <input name="azureClientId" value={formData.azureClientId} onChange={handleInputChange} className="glass-input" />
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border-subtle p-5 rounded-2xl relative shadow-sm group mt-6">
            <h4 className="absolute -top-3 left-4 bg-surface px-2 text-[10px] font-black tracking-widest uppercase text-muted group-focus-within:text-brand-primary transition-colors">Email Service</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black text-muted uppercase ml-1">Email Provider</label>
                <select name="emailProvider" value={formData.emailProvider} onChange={handleInputChange} className="glass-input cursor-pointer">
                  <option value="Default">Use Default (Abidi Solutions Gmail)</option>
                  <option value="Custom">Custom SMTP Credentials</option>
                </select>
              </div>
              {formData.emailProvider === "Custom" && (
                <>
                  <input name="smtpHost" value={formData.smtpHost} placeholder="SMTP Host" onChange={handleInputChange} className="glass-input" />
                  <input name="smtpPort" value={formData.smtpPort} placeholder="SMTP Port" onChange={handleInputChange} className="glass-input" />
                  <input name="smtpUser" value={formData.smtpUser} placeholder="SMTP User" onChange={handleInputChange} className="glass-input" />
                  <input name="smtpPass" type="password" value={formData.smtpPass} placeholder="SMTP Pass" onChange={handleInputChange} className="glass-input" />
                  <input name="fromEmail" value={formData.fromEmail} placeholder="From Email" onChange={handleInputChange} className="glass-input sm:col-span-2" />
                </>
              )}
            </div>
          </div>
        </form>
      </GlassModal>

      {/* --- VIEW MODAL --- */}
      <GlassModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Tenant Details"
        description="Overview of company information."
        maxWidth="max-w-3xl"
        footer={
          <GlassButton type="button" variant="secondary" onClick={() => setIsViewModalOpen(false)}>Close</GlassButton>
        }
      >
        {selectedTenant && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-4">
              <div className="bg-surface border border-border-subtle p-5 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl font-black">
                    {selectedTenant.companyName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-heading">{selectedTenant.companyName}</h3>
                    <p className="text-xs text-muted flex items-center gap-2">
                      <span className={`lm-success-badge ${selectedTenant.subscriptionStatus === "Suspended" ? "lm-danger-badge" : ""}`}>
                        {selectedTenant.subscriptionStatus || "Active"}
                      </span>
                      {selectedTenant.isMasterTenant && (
                        <span className="lm-success-badge">Master</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Type</p>
                    <p className="text-sm font-semibold text-main">{selectedTenant.companyType}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Address</p>
                    <p className="text-sm font-semibold text-main">{selectedTenant.address}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Website</p>
                    <p className="text-sm font-semibold text-brand-primary break-all">{selectedTenant.website}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-surface border border-border-subtle p-5 rounded-2xl shadow-sm">
                <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-3 border-b border-border-subtle pb-2">Primary Contact</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Owner Name</p>
                    <p className="text-sm font-semibold text-main">{selectedTenant.companyOwner}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Email Address</p>
                    <p className="text-sm font-semibold text-main break-all">{selectedTenant.companyEmail}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Contact No.</p>
                    <p className="text-sm font-semibold text-main">{selectedTenant.contactNo}</p>
                  </div>
                </div>
              </div>

              <div className="bg-surface border border-border-subtle p-5 rounded-2xl shadow-sm">
                <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-3 border-b border-border-subtle pb-2">Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Employees</p>
                    <p className="text-sm font-semibold text-main">{selectedTenant.noOfEmployees} / {selectedTenant.maxUsers || 50}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Timezone</p>
                    <p className="text-sm font-semibold text-main">{selectedTenant.timezone || "America/New_York"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">SSO Status</p>
                    <p className="text-sm font-semibold text-main">{selectedTenant.azureTenantId ? "Configured" : "Not Set"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Email Status</p>
                    <p className="text-sm font-semibold text-main">{selectedTenant.emailConfig?.provider === "Custom" ? "Custom SMTP" : "Default"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </GlassModal>
    </>
  );
}

export default TenantManagement;