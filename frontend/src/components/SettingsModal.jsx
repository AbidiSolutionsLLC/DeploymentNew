import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  X, Check, Sun, Moon, Monitor, Bell, Mail, User as UserIcon,
  LogOut, Palette, AlertTriangle, Loader2, FolderKanban, Search,
} from "lucide-react";
import api from "../axios";
import settingsApi from "../api/settingsApi";
import { logout, setAuthUser } from "../slices/authSlice";
import { setUser } from "../slices/userSlice";
import { useTheme } from "../context/ThemeContext";
import ToggleSwitch from "./ui/ToggleSwitch";
import GlassButton from "./ui/GlassButton";

const EASE = [0.16, 1, 0.3, 1];

const TABS = [
  { id: "appearance", label: "Appearance", hint: "Theme & look", icon: Palette },
  { id: "notifications", label: "Notifications", hint: "Email alerts", icon: Bell },
  { id: "account", label: "Account", hint: "Profile & session", icon: UserIcon },
];

const THEME_OPTIONS = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

function SectionHeading({ icon, title, subtitle }) {
  const Icon = icon;
  return (
    <div className="mb-5 flex items-start gap-3">
      <span
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: "var(--gradient-gold-foil)", color: "var(--color-text-on-brand)" }}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div>
        <h3 className="text-base font-bold leading-tight" style={{ color: "var(--color-text-heading)" }}>
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-xs leading-snug" style={{ color: "var(--color-text-tertiary)" }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div
      className="flex items-center justify-between gap-6 py-2.5 last:border-0"
      style={{ borderBottom: "1px solid var(--color-border-secondary)" }}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
        {label}
      </span>
      <span className="min-w-0 truncate text-right text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

export default function SettingsModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { instance } = useMsal();
  const { themeMode, setThemeMode } = useTheme();

  const authStateUser = useSelector((s) => s.auth.user);
  const user = authStateUser?.data?.user || authStateUser?.user || authStateUser || null;
  const emailPreferences = user?.notificationPreferences?.email || {};
  const emailEnabled = emailPreferences.enabled !== false;

  const [tab, setTab] = useState("appearance");
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // --- PROJECT PORTAL ASSIGNMENT STATE ---
  const userRole = (user?.role || '').replace(/\s+/g, '').toLowerCase();
  const isAdminOrSuper = userRole === 'superadmin' || userRole === 'admin';
  const [portalUsers, setPortalUsers] = useState([]);
  const [loadingPortalUsers, setLoadingPortalUsers] = useState(false);
  const [portalSearch, setPortalSearch] = useState('');
  const [savingPortalAccess, setSavingPortalAccess] = useState(false);

  useEffect(() => {
    if (!isOpen || !isAdminOrSuper) return;
    let mounted = true;
    (async () => {
      try {
        setLoadingPortalUsers(true);
        const res = await api.get('/users?limit=1000');
        const list = res.data?.data || res.data || [];
        if (mounted) setPortalUsers(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load users for portal assignment', err);
      } finally {
        if (mounted) setLoadingPortalUsers(false);
      }
    })();
    return () => { mounted = false; };
  }, [isOpen, isAdminOrSuper]);

  const handleTogglePortalAccess = (userId) => {
    setPortalUsers(prev => prev.map(u => {
      if ((u._id || u.id) === userId) {
        return { ...u, hasProjectPortalAccess: !u.hasProjectPortalAccess };
      }
      return u;
    }));
  };

  const handleSavePortalAccess = async () => {
    try {
      setSavingPortalAccess(true);
      const assignedIds = portalUsers
        .filter(u => u.hasProjectPortalAccess || ['superadmin', 'admin'].includes((u.role || '').replace(/\s+/g, '').toLowerCase()))
        .map(u => u._id || u.id);

      await api.put('/users/project-portal-access', { userIds: assignedIds });
      toast.success('Project Portal access updated successfully');

      const currentId = user._id || user.id;
      const currentUserInList = portalUsers.find(u => (u._id || u.id) === currentId);
      if (currentUserInList) {
        const updatedAuth = { ...user, hasProjectPortalAccess: currentUserInList.hasProjectPortalAccess };
        dispatch(setAuthUser(updatedAuth));
        dispatch(setUser(updatedAuth));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update Project Portal access');
    } finally {
      setSavingPortalAccess(false);
    }
  };

  // Escape to close + scroll lock while open
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setConfirmSignOut(false);
      setAvatarError(false);
    }
  }, [isOpen]);
  // Load the role-eligible email categories lazily when the modal opens
  useEffect(() => {
    if (!isOpen) return undefined;
    let active = true;
    (async () => {
      try {
        setLoadingCategories(true);
        const res = await settingsApi.getNotificationSettings();
        const data = res?.data || res;
        if (active) setCategories(Array.isArray(data?.emailCategories) ? data.emailCategories : []);
      } catch {
        if (active) setCategories([]);
      } finally {
        if (active) setLoadingCategories(false);
      }
    })();
    return () => { active = false; };
  }, [isOpen]);

  const updateEmailPreferences = async (patch) => {
    if (savingPrefs) return;
    const previous = user;
    const optimistic = {
      ...(user || {}),
      notificationPreferences: {
        ...(user?.notificationPreferences || {}),
        email: { ...emailPreferences, ...patch },
      },
    };
    dispatch(setAuthUser(optimistic));
    dispatch(setUser(optimistic));
    try {
      setSavingPrefs(true);
      const res = await settingsApi.updateSettings({ notificationPreferences: { email: patch } });
      const updated = res?.data?.user || res?.data || res;
      if (updated?.notificationPreferences) {
        const merged = { ...(previous || {}), ...updated, notificationPreferences: updated.notificationPreferences };
        dispatch(setAuthUser(merged));
        dispatch(setUser(merged));
      }
      toast.success("Notification preferences updated");
    } catch (err) {
      if (previous) { dispatch(setAuthUser(previous)); dispatch(setUser(previous)); }
      toast.error(err?.response?.data?.message || "Failed to update notification preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {}, { headers: { _isLogoutRequest: true } });
    } catch (err) {
      console.warn("Logout API failed:", err.message);
    } finally {
      dispatch(logout());
      const accounts = instance?.getAllAccounts?.();
      if (accounts && accounts.length > 0) {
        instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
      } else {
        navigate("/auth/login");
      }
    }
  };

  if (!isOpen) return null;

  const initials = (user?.name || "User")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const role = user?.role || "Member";
  const department = typeof user?.department === "object" ? user?.department?.name : user?.department;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      style={{ background: "var(--color-overlay)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div
        className="absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-[10000] flex h-[86vh] max-h-[720px] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border shadow-2xl animate-slideInUp"
        style={{ background: "var(--color-bg-primary)", borderColor: "var(--color-border-accent)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <header
          className="relative flex shrink-0 items-center gap-4 px-5 py-4 sm:px-6 sm:py-5"
          style={{ borderBottom: "1px solid var(--color-border-accent)" }}
        >
          <div
            className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-black shadow-lg"
            style={{ background: "var(--gradient-gold-foil)", color: "var(--color-text-on-brand)" }}
          >
            {user?.avatar && !avatarError ? (
              <img
                src={user.avatar}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              initials
            )}
          </div>

          <div className="relative min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold leading-tight" style={{ color: "var(--color-text-heading)" }}>
              {user?.name || "Settings"}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                style={{ background: "var(--color-bg-hover)", color: "var(--color-brand-text)", border: "1px solid var(--color-border-accent)" }}
              >
                {role}
              </span>
              {user?.email && (
                <span className="truncate text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                  {user.email}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-[var(--color-bg-hover)]"
            style={{ color: "var(--color-text-muted)" }}
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* ── Body ── */}
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          {/* Navigation */}
          <nav
            className="flex shrink-0 gap-2 overflow-x-auto border-b p-3 no-scrollbar sm:w-60 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r"
            style={{ borderColor: "var(--color-border-primary)" }}
          >
            {[
              ...TABS,
              ...(isAdminOrSuper ? [{ id: "portalAccess", label: "Portal Access", hint: "Project assignment", icon: FolderKanban }] : [])
            ].map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className="group flex items-center gap-3 whitespace-nowrap rounded-2xl px-3 py-2.5 text-left transition-all"
                  style={{
                    background: active ? "var(--color-bg-active)" : "transparent",
                    border: `1px solid ${active ? "var(--color-border-accent)" : "transparent"}`,
                  }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors"
                    style={{
                      background: active ? "var(--gradient-gold-foil)" : "var(--color-bg-hover)",
                      color: active ? "var(--color-text-on-brand)" : "var(--color-brand-primary)",
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold" style={{ color: active ? "var(--color-brand-text)" : "var(--color-text-secondary)" }}>
                      {item.label}
                    </span>
                    <span className="hidden text-[11px] sm:block" style={{ color: "var(--color-text-tertiary)" }}>
                      {item.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="custom-scrollbar-visible min-h-0 min-w-0 flex-1 overflow-y-auto p-5 sm:p-6">
            <AnimatePresence mode="wait">
              <Motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: EASE }}
              >
                {/* ─── APPEARANCE ─── */}
                {tab === "appearance" && (
                  <div>
                    <SectionHeading
                      icon={Palette}
                      title="Appearance"
                      subtitle="Choose how Karbexa looks on this device."
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {THEME_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const active = themeMode === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setThemeMode(option.id)}
                            className="relative flex flex-col gap-3 rounded-2xl p-4 text-left transition-all"
                            style={{
                              background: "var(--color-bg-secondary)",
                              border: `2px solid ${active ? "var(--color-brand-primary)" : "var(--color-border-primary)"}`,
                              boxShadow: active ? "0 10px 26px rgba(184,134,11,0.22)" : "none",
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className="flex h-9 w-9 items-center justify-center rounded-xl"
                                style={{ background: "var(--color-bg-hover)", color: "var(--color-brand-primary)" }}
                              >
                                <Icon className="h-[18px] w-[18px]" />
                              </span>
                              {active && (
                                <span
                                  className="flex h-5 w-5 items-center justify-center rounded-full"
                                  style={{ background: "var(--color-brand-primary)" }}
                                >
                                  <Check className="h-3 w-3" style={{ color: "var(--color-text-on-brand)" }} />
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold" style={{ color: "var(--color-text-heading)" }}>
                                {option.label}
                              </p>
                              <p className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
                                {active ? "Currently active" : "Click to apply"}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ─── NOTIFICATIONS ─── */}
                {tab === "notifications" && (
                  <div>
                    <SectionHeading
                      icon={Bell}
                      title="Email notifications"
                      subtitle="Choose which emails you receive. Only notifications relevant to your role are shown."
                    />

                    <div
                      className="mb-4 flex items-center gap-3 rounded-2xl px-4 py-3.5"
                      style={{ background: "var(--color-bg-hover)", border: "1px solid var(--color-border-accent)" }}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: "var(--gradient-gold-foil)", color: "var(--color-text-on-brand)" }}
                      >
                        <Mail className="h-[18px] w-[18px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold" style={{ color: "var(--color-text-heading)" }}>
                          {emailEnabled ? "Email notifications are on" : "Email notifications are off"}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
                          {emailEnabled
                            ? "You'll receive emails for the categories below."
                            : "You won't receive any notification emails."}
                        </p>
                      </div>
                      <ToggleSwitch
                        id="settings-email-master-toggle"
                        checked={emailEnabled}
                        disabled={savingPrefs}
                        onChange={(val) => updateEmailPreferences({ enabled: val })}
                        ariaLabel="Enable or disable all email notifications"
                      />
                    </div>

                    <div className={emailEnabled ? "transition-opacity" : "pointer-events-none opacity-40 transition-opacity"}>
                      {loadingCategories && (
                        <div className="space-y-2">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-xl px-4 py-3"
                              style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border-primary)" }}
                            >
                              <div className="space-y-2">
                                <div className="h-3 w-32 rounded-full" style={{ background: "var(--color-bg-hover)" }} />
                                <div className="h-2.5 w-48 rounded-full" style={{ background: "var(--color-bg-hover)" }} />
                              </div>
                              <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--color-text-muted)" }} />
                            </div>
                          ))}
                        </div>
                      )}

                      {!loadingCategories && categories.length === 0 && (
                        <div
                          className="flex flex-col items-center gap-2 rounded-2xl px-6 py-10 text-center"
                          style={{ background: "var(--color-bg-secondary)", border: "1px dashed var(--color-border-accent)" }}
                        >
                          <Bell className="h-6 w-6" style={{ color: "var(--color-text-muted)" }} />
                          <p className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                            No email notifications for your role
                          </p>
                          <p className="max-w-xs text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                            Your role doesn't receive notification emails, so there's nothing to configure here.
                          </p>
                        </div>
                      )}

                      {!loadingCategories && categories.map((category) => {
                        const isOn = emailPreferences[category.key] !== false;
                        return (
                          <div
                            key={category.key}
                            className="mb-2 flex items-center gap-3 rounded-xl px-4 py-3"
                            style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border-primary)" }}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                                {category.label}
                              </p>
                              {category.description && (
                                <p className="text-xs leading-snug" style={{ color: "var(--color-text-tertiary)" }}>
                                  {category.description}
                                </p>
                              )}
                            </div>
                            <ToggleSwitch
                              id={`settings-email-${category.key}`}
                              size="sm"
                              checked={isOn}
                              disabled={savingPrefs}
                              onChange={(val) => updateEmailPreferences({ [category.key]: val })}
                              ariaLabel={`Toggle ${category.label} emails`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ─── PORTAL ACCESS (SUPER ADMIN & ADMIN ONLY) ─── */}
                {tab === "portalAccess" && isAdminOrSuper && (
                  <div>
                    <SectionHeading
                      icon={FolderKanban}
                      title="Project Portal Access"
                      subtitle="Assign users who can see the Project Portal icon and access project workspaces."
                    />

                    {/* Summary bar + search */}
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                        <input
                          type="text"
                          value={portalSearch}
                          onChange={(e) => setPortalSearch(e.target.value)}
                          placeholder="Search users by name, email, or role..."
                          className="glass-input !pl-9 w-full"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="rounded-full px-3 py-1 text-xs font-bold"
                          style={{
                            background: "var(--color-bg-hover)",
                            color: "var(--color-brand-text)",
                            border: "1px solid var(--color-border-accent)"
                          }}
                        >
                          {portalUsers.filter(u => u.hasProjectPortalAccess || ['superadmin', 'admin'].includes((u.role || '').replace(/\s+/g, '').toLowerCase())).length} of {portalUsers.length} assigned
                        </span>
                        <GlassButton
                          variant="primary"
                          size="sm"
                          onClick={handleSavePortalAccess}
                          isLoading={savingPortalAccess}
                        >
                          Save Changes
                        </GlassButton>
                      </div>
                    </div>

                    {/* User list */}
                    {loadingPortalUsers ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted">
                        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
                        <span className="text-xs">Loading users...</span>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar-visible pr-1">
                        {portalUsers
                          .filter(u => {
                            const q = portalSearch.toLowerCase().trim();
                            if (!q) return true;
                            const name = (u.name || '').toLowerCase();
                            const email = (u.email || '').toLowerCase();
                            const role = (u.role || '').toLowerCase();
                            const dept = (typeof u.department === 'object' ? u.department?.name : u.department || '').toLowerCase();
                            return name.includes(q) || email.includes(q) || role.includes(q) || dept.includes(q);
                          })
                          .map(u => {
                            const uId = u._id || u.id;
                            const cleanRole = (u.role || '').replace(/\s+/g, '').toLowerCase();
                            const isUserAdmin = cleanRole === 'superadmin' || cleanRole === 'admin';
                            const isAssigned = isUserAdmin || Boolean(u.hasProjectPortalAccess);

                            return (
                              <div
                                key={uId}
                                className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-colors"
                                style={{
                                  background: "var(--color-bg-secondary)",
                                  border: `1px solid ${isAssigned ? "var(--color-border-accent)" : "var(--color-border-primary)"}`
                                }}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-sm"
                                    style={{
                                      background: "var(--gradient-gold-foil)",
                                      color: "var(--color-text-on-brand)"
                                    }}
                                  >
                                    {u.avatar ? (
                                      <img src={u.avatar} alt="" className="h-full w-full object-cover rounded-xl" />
                                    ) : (
                                      (u.name || 'U').charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                                        {u.name || u.email}
                                      </p>
                                      <span
                                        className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                                        style={{
                                          background: "var(--color-bg-hover)",
                                          color: "var(--color-brand-text)",
                                          border: "1px solid var(--color-border-accent)"
                                        }}
                                      >
                                        {u.role || "Employee"}
                                      </span>
                                    </div>
                                    <p className="text-[11px] truncate" style={{ color: "var(--color-text-tertiary)" }}>
                                      {u.email}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {isUserAdmin ? (
                                    <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                                      Admin (Always On)
                                    </span>
                                  ) : (
                                    <ToggleSwitch
                                      id={`portal-assign-${uId}`}
                                      size="sm"
                                      checked={Boolean(u.hasProjectPortalAccess)}
                                      disabled={savingPortalAccess}
                                      onChange={() => handleTogglePortalAccess(uId)}
                                      ariaLabel={`Toggle project portal access for ${u.name || u.email}`}
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}

                {/* ─── ACCOUNT ─── */}
                {tab === "account" && (
                  <div>
                    <SectionHeading
                      icon={UserIcon}
                      title="Account"
                      subtitle="Your profile details and session."
                    />

                    <div
                      className="rounded-2xl px-4 py-2"
                      style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border-primary)" }}
                    >
                      <InfoRow label="Name" value={user?.name} />
                      <InfoRow label="Email" value={user?.email} />
                      <InfoRow label="Role" value={role} />
                      <InfoRow label="Department" value={department} />
                      <InfoRow label="Designation" value={user?.designation} />
                      <InfoRow label="Employee ID" value={user?.empID} />
                    </div>

                    <div
                      className="mt-6 rounded-2xl p-4"
                      style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.28)" }}
                    >
                      {!confirmSignOut ? (
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                            style={{ background: "var(--color-bg-secondary)", color: "#ef4444" }}
                          >
                            <LogOut className="h-[18px] w-[18px]" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold" style={{ color: "var(--color-text-heading)" }}>
                              Sign out
                            </p>
                            <p className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
                              End your session on this device.
                            </p>
                          </div>
                          <GlassButton variant="danger" size="sm" onClick={() => setConfirmSignOut(true)}>
                            Sign out
                          </GlassButton>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#ef4444" }} />
                            <p className="text-sm font-semibold" style={{ color: "var(--color-text-heading)" }}>
                              Are you sure you want to sign out?
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <GlassButton variant="secondary" size="sm" onClick={() => setConfirmSignOut(false)}>
                              Cancel
                            </GlassButton>
                            <GlassButton
                              variant="danger"
                              size="sm"
                              icon={LogOut}
                              onClick={handleLogout}
                            >
                              Sign out
                            </GlassButton>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
